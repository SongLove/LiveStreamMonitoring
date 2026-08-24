import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../common/constants/queues';
import { RedisService } from '../../common/redis/redis.service';
import { AnchorService } from '../anchor/anchor.service';
import { CrawlerService } from '../crawler/crawler.service';
import { LiveService } from '../live/live.service';
import { NotifyService } from '../notify/notify.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Anchor, AnchorDocument } from '../anchor/anchor.schema';
import { QuotaLedger, QuotaLedgerDocument } from '../quota/quota-ledger.schema';
import { UserQuota, UserQuotaDocument } from '../quota/user-quota.schema';

const TIER_INTERVAL_MS: Record<number, number> = {
  1: 30_000,
  2: 60_000,
  3: 180_000,
};

@Injectable()
export class SchedulerBootstrap implements OnModuleInit {
  private readonly logger = new Logger(SchedulerBootstrap.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.POLL_SCHEDULE) private readonly pollSchedule: Queue,
    @InjectQueue(QUEUE_NAMES.ANCHOR_REFRESH) private readonly anchorRefresh: Queue,
    @InjectQueue(QUEUE_NAMES.QUOTA_RECONCILE) private readonly quotaReconcile: Queue,
    @InjectQueue(QUEUE_NAMES.METRICS_ROLLUP) private readonly metricsRollup: Queue,
    @InjectQueue(QUEUE_NAMES.DATA_CLEANUP) private readonly dataCleanup: Queue,
  ) {}

  async onModuleInit() {
    await this.pollSchedule.upsertJobScheduler(
      'poll-schedule-tick',
      { every: 5000 },
      { name: 'tick', data: {} },
    );
    await this.anchorRefresh.upsertJobScheduler(
      'anchor-refresh',
      { every: 6 * 3600_000 },
      { name: 'refresh', data: {} },
    );
    await this.quotaReconcile.upsertJobScheduler(
      'quota-reconcile',
      { pattern: '0 3 * * *' },
      { name: 'reconcile', data: {} },
    );
    await this.metricsRollup.upsertJobScheduler(
      'metrics-rollup',
      { every: 5 * 60_000 },
      { name: 'rollup', data: {} },
    );
    await this.dataCleanup.upsertJobScheduler(
      'data-cleanup',
      { pattern: '0 4 * * 0' },
      { name: 'cleanup', data: {} },
    );
    this.logger.log('Worker repeatable jobs registered');
  }
}

@Processor(QUEUE_NAMES.POLL_SCHEDULE)
export class PollScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(PollScheduleProcessor.name);

  constructor(
    private readonly redis: RedisService,
    private readonly anchorService: AnchorService,
    @InjectQueue(QUEUE_NAMES.POLL_EXECUTE) private readonly pollExecute: Queue,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const lock = await this.redis.acquireLock('lock:poll-schedule', 4000);
    if (!lock) return;
    try {
      const due = await this.anchorService.listDue(200);
      const groups = new Map<string, string[]>();
      for (const a of due) {
        const key = a.platform;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(String(a._id));
      }
      for (const [platform, anchorIds] of groups) {
        const chunkSize = platform === 'bilibili' ? 20 : 10;
        for (let i = 0; i < anchorIds.length; i += chunkSize) {
          const chunk = anchorIds.slice(i, i + chunkSize);
          await this.pollExecute.add('execute', { platform, anchorIds: chunk });
        }
      }
    } finally {
      await this.redis.releaseLock('lock:poll-schedule', lock);
    }
  }
}

@Processor(QUEUE_NAMES.POLL_EXECUTE)
export class PollExecuteProcessor extends WorkerHost {
  constructor(
    @InjectModel(Anchor.name) private readonly anchorModel: Model<AnchorDocument>,
    private readonly crawler: CrawlerService,
    private readonly liveService: LiveService,
    @InjectQueue(QUEUE_NAMES.POLL_EXECUTE) private readonly pollExecute: Queue,
  ) {
    super();
  }

  async process(job: Job<{ platform: string; anchorIds: string[] }>): Promise<void> {
    const { platform, anchorIds } = job.data;
    const anchors = await this.anchorModel.find({ _id: { $in: anchorIds } });
    // 抖音探测用 roomId（抖音号）；platformUid 多为 sec_uid，live.douyin.com 认前者
    const uids = anchors.map((a) =>
      platform === 'douyin' && a.roomId ? a.roomId : a.platformUid,
    );
    const { results, deferred, allFailed } = await this.crawler.fetchStatuses(
      platform as any,
      uids,
    );
    if (deferred) {
      await this.pollExecute.add('execute', job.data, { delay: 2000 });
      return;
    }
    const byUid = new Map(results.map((r) => [r.platformUid, r]));
    for (const a of anchors) {
      const interval = TIER_INTERVAL_MS[a.pollTier] || 60_000;
      a.lastPolledAt = new Date(Date.now() + interval);
      await a.save();
      if (allFailed) continue;
      const r =
        byUid.get(a.platformUid) ||
        (a.roomId ? byUid.get(a.roomId) : undefined);
      if (!r) continue;
      await this.liveService.applyProbeResult(String(a._id), r.status, {
        provider: r.provider,
        confidence: r.confidence,
        title: r.title,
        coverUrl: r.coverUrl,
        startedAt: r.startedAt,
      });
    }
  }
}

@Processor(QUEUE_NAMES.POLL_CONFIRM)
export class PollConfirmProcessor extends WorkerHost {
  constructor(
    @InjectModel(Anchor.name) private readonly anchorModel: Model<AnchorDocument>,
    private readonly crawler: CrawlerService,
    private readonly liveService: LiveService,
  ) {
    super();
  }

  async process(job: Job<{ anchorId: string }>): Promise<void> {
    const anchor = await this.anchorModel.findById(job.data.anchorId);
    if (!anchor) return;
    const probeId =
      anchor.platform === 'douyin' && anchor.roomId
        ? anchor.roomId
        : anchor.platformUid;
    const { results, allFailed } = await this.crawler.fetchStatuses(anchor.platform, [
      probeId,
    ]);
    if (allFailed || !results[0]) return;
    const r = results[0];
    await this.liveService.applyProbeResult(String(anchor._id), r.status, {
      provider: r.provider,
      confidence: Math.max(r.confidence, 0.9),
      title: r.title,
      coverUrl: r.coverUrl,
    });
  }
}

@Processor(QUEUE_NAMES.NOTIFY_DISPATCH)
export class NotifyDispatchProcessor extends WorkerHost {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    @InjectQueue(QUEUE_NAMES.NOTIFY_SEND) private readonly notifySend: Queue,
  ) {
    super();
  }

  async process(job: Job<{ sessionId: string; anchorId: string }>): Promise<void> {
    const subs = await this.subscriptionService.listEnabledByAnchor(job.data.anchorId);
    for (const s of subs) {
      await this.notifySend.add(
        'send',
        {
          userId: String(s.userId),
          sessionId: job.data.sessionId,
          anchorId: job.data.anchorId,
        },
        { jobId: `send:${job.data.sessionId}:${s.userId}` },
      );
    }
  }
}

@Processor(QUEUE_NAMES.NOTIFY_SEND)
export class NotifySendProcessor extends WorkerHost {
  constructor(private readonly notifyService: NotifyService) {
    super();
  }

  async process(
    job: Job<{ userId: string; sessionId: string; anchorId: string }>,
  ): Promise<void> {
    await this.notifyService.sendForUser(job.data);
  }
}

@Processor(QUEUE_NAMES.ANCHOR_REFRESH)
export class AnchorRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(AnchorRefreshProcessor.name);
  async process(): Promise<void> {
    this.logger.log('anchor-refresh tick');
  }
}

@Processor(QUEUE_NAMES.QUOTA_RECONCILE)
export class QuotaReconcileProcessor extends WorkerHost {
  private readonly logger = new Logger(QuotaReconcileProcessor.name);
  constructor(
    @InjectModel(QuotaLedger.name) private readonly ledger: Model<QuotaLedgerDocument>,
    @InjectModel(UserQuota.name) private readonly quota: Model<UserQuotaDocument>,
  ) {
    super();
  }
  async process(): Promise<void> {
    this.logger.log('quota-reconcile tick');
    // Lightweight consistency check: count users with snapshots
    const n = await this.quota.countDocuments();
    this.logger.log(`user_quota rows=${n}`);
  }
}

@Processor(QUEUE_NAMES.METRICS_ROLLUP)
export class MetricsRollupProcessor extends WorkerHost {
  private readonly logger = new Logger(MetricsRollupProcessor.name);
  async process(): Promise<void> {
    this.logger.debug('metrics-rollup tick');
  }
}

@Processor(QUEUE_NAMES.DATA_CLEANUP)
export class DataCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(DataCleanupProcessor.name);
  async process(): Promise<void> {
    this.logger.log('data-cleanup tick');
  }
}
