import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import {
  LiveSession,
  LiveSessionDocument,
  buildSessionKey,
} from './live-session.schema';
import { Anchor, AnchorDocument } from '../anchor/anchor.schema';
import { RedisService } from '../../common/redis/redis.service';
import { QUEUE_NAMES } from '../../common/constants/queues';
import { NormalizedLiveStatus } from '../crawler/providers/provider.types';

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    @InjectModel(LiveSession.name) private readonly sessionModel: Model<LiveSessionDocument>,
    @InjectModel(Anchor.name) private readonly anchorModel: Model<AnchorDocument>,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.NOTIFY_DISPATCH) private readonly notifyDispatch: Queue,
    @InjectQueue(QUEUE_NAMES.POLL_CONFIRM) private readonly pollConfirm: Queue,
  ) {}

  snapshotKey(anchorId: string) {
    return `live:snapshot:${anchorId}`;
  }

  async applyProbeResult(
    anchorId: string,
    status: NormalizedLiveStatus,
    meta: { provider: string; confidence: number; title?: string; coverUrl?: string; startedAt?: Date },
  ) {
    const anchor = await this.anchorModel.findById(anchorId);
    if (!anchor) return { transition: 'none' as const };

    if (status === 'probe_failed') {
      return this.handleProbeFailed(anchor);
    }

    // 成功探测：清零探测失败计数
    anchor.consecutiveProbeFailed = 0;

    const isLive = status === 'live';

    await this.redis.set(
      this.snapshotKey(anchorId),
      JSON.stringify({ status, at: Date.now(), provider: meta.provider }),
      3600,
    );

    const minRebroadcast = this.config.get<number>('live.minRebroadcastMinutes') || 30;
    const confirmOffline = this.config.get<number>('live.confirmOfflinePolls') || 2;

    if (isLive) {
      anchor.consecutiveOffline = 0;
      if (anchor.liveState === 'offline') {
        if (meta.confidence < 0.8) {
          anchor.liveState = 'pending_confirm';
          await anchor.save();
          await this.pollConfirm.add(
            'confirm',
            { anchorId },
            { delay: 15_000, jobId: `confirm:${anchorId}:${Date.now()}` },
          );
          return { transition: 'pending_confirm' as const };
        }
        return this.confirmLive(anchor, meta, minRebroadcast);
      }
      if (anchor.liveState === 'pending_confirm') {
        return this.confirmLive(anchor, meta, minRebroadcast);
      }
      await anchor.save();
      return { transition: 'still_live' as const };
    }

    // not live
    if (anchor.liveState === 'live' || anchor.liveState === 'pending_confirm') {
      anchor.consecutiveOffline += 1;
      if (anchor.consecutiveOffline >= confirmOffline) {
        await this.markOffline(anchor);
      } else {
        await anchor.save();
      }
      return { transition: 'offline_progress' as const };
    }

    anchor.liveState = 'offline';
    await anchor.save();
    return { transition: 'offline' as const };
  }

  /**
   * 探测失败：默认保持原状态；若当前为 live/pending 且连续失败达阈值，强制下播。
   * 避免 Playwright 崩溃时列表永久卡在「直播中」。
   */
  private async handleProbeFailed(anchor: AnchorDocument) {
    const threshold = this.config.get<number>('live.probeFailForceOffline') || 3;
    const wasShowingLive =
      anchor.liveState === 'live' || anchor.liveState === 'pending_confirm';

    if (!wasShowingLive) {
      this.logger.warn(`Probe failed for ${anchor.id}, keep offline`);
      return { transition: 'probe_failed' as const };
    }

    anchor.consecutiveProbeFailed = (anchor.consecutiveProbeFailed || 0) + 1;
    if (anchor.consecutiveProbeFailed < threshold) {
      this.logger.warn(
        `Probe failed for ${anchor.id} (${anchor.consecutiveProbeFailed}/${threshold}), keep ${anchor.liveState}`,
      );
      await anchor.save();
      return { transition: 'probe_failed' as const };
    }

    this.logger.warn(
      `Probe failed ${anchor.consecutiveProbeFailed}x for ${anchor.id}, force offline`,
    );
    await this.markOffline(anchor);
    return { transition: 'force_offline' as const };
  }

  private async markOffline(anchor: AnchorDocument) {
    anchor.liveState = 'offline';
    anchor.consecutiveProbeFailed = 0;
    await this.sessionModel.updateMany(
      { anchorId: anchor._id, status: 'live' },
      { $set: { status: 'ended', endedAt: new Date() } },
    );
    await anchor.save();
  }

  private async confirmLive(
    anchor: AnchorDocument,
    meta: { provider: string; title?: string; coverUrl?: string; startedAt?: Date },
    minRebroadcast: number,
  ) {
    // 仅当「上一场 session 仍在 live」时才抑制重复推送；已下播后再次开播必须通知
    const activeSession = await this.sessionModel.findOne({
      anchorId: anchor._id,
      status: 'live',
    });
    if (activeSession && anchor.lastLiveAt) {
      const diff = Date.now() - new Date(anchor.lastLiveAt).getTime();
      if (diff < minRebroadcast * 60_000) {
        anchor.liveState = 'live';
        await anchor.save();
        this.logger.log(
          `rebroadcast_cooldown anchor=${anchor.id} activeSession=${activeSession.id}`,
        );
        return { transition: 'rebroadcast_cooldown' as const };
      }
    }

    const startedAt = meta.startedAt || new Date();
    const sessionKey = buildSessionKey(String(anchor._id), startedAt);
    let session: LiveSessionDocument | null = null;
    try {
      session = await this.sessionModel.create({
        anchorId: anchor._id,
        sessionKey,
        platform: anchor.platform,
        startedAt,
        status: 'live',
        provider: meta.provider,
        title: meta.title || anchor.liveTitle,
        coverUrl: meta.coverUrl || anchor.coverUrl,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        session = await this.sessionModel.findOne({ sessionKey });
        anchor.liveState = 'live';
        await anchor.save();
        if (session?.id) {
          await this.enqueueNotifyDispatch(String(session.id), String(anchor._id));
        }
        return { transition: 'session_exists' as const, sessionId: session?.id };
      }
      throw err;
    }

    anchor.liveState = 'live';
    anchor.lastLiveAt = startedAt;
    if (meta.title) anchor.liveTitle = meta.title;
    if (meta.coverUrl) anchor.coverUrl = meta.coverUrl;
    await anchor.save();

    await this.enqueueNotifyDispatch(String(session.id), String(anchor._id));
    this.logger.log(
      `live confirmed anchor=${anchor.id} session=${session.id} → notify dispatch`,
    );

    return { transition: 'live' as const, sessionId: session.id };
  }

  private async enqueueNotifyDispatch(sessionId: string, anchorId: string) {
    await this.notifyDispatch.add(
      'dispatch',
      { sessionId, anchorId },
      { jobId: `dispatch:${sessionId}` },
    );
  }

  async listForUser(userId: string, page = 1, pageSize = 20) {
    // Sessions for anchors the user follows — simplified: all recent sessions
    const [items, total] = await Promise.all([
      this.sessionModel
        .find()
        .sort({ startedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.sessionModel.countDocuments(),
    ]);
    return { items, total, page, pageSize, userId };
  }
}

export { buildSessionKey };
