"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SchedulerBootstrap_1, PollScheduleProcessor_1, PollExecuteProcessor_1, AnchorRefreshProcessor_1, QuotaReconcileProcessor_1, MetricsRollupProcessor_1, DataCleanupProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCleanupProcessor = exports.MetricsRollupProcessor = exports.QuotaReconcileProcessor = exports.AnchorRefreshProcessor = exports.NotifySendProcessor = exports.NotifyDispatchProcessor = exports.PollConfirmProcessor = exports.PollExecuteProcessor = exports.PollScheduleProcessor = exports.SchedulerBootstrap = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const queues_1 = require("../../common/constants/queues");
const redis_service_1 = require("../../common/redis/redis.service");
const anchor_service_1 = require("../anchor/anchor.service");
const crawler_service_1 = require("../crawler/crawler.service");
const live_service_1 = require("../live/live.service");
const notify_service_1 = require("../notify/notify.service");
const subscription_service_1 = require("../subscription/subscription.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const anchor_schema_1 = require("../anchor/anchor.schema");
const quota_ledger_schema_1 = require("../quota/quota-ledger.schema");
const user_quota_schema_1 = require("../quota/user-quota.schema");
const TIER_INTERVAL_MS = {
    1: 30_000,
    2: 60_000,
    3: 180_000,
};
const PROBE_FAIL_RETRY_MS = 20_000;
let SchedulerBootstrap = SchedulerBootstrap_1 = class SchedulerBootstrap {
    constructor(pollSchedule, anchorRefresh, quotaReconcile, metricsRollup, dataCleanup) {
        this.pollSchedule = pollSchedule;
        this.anchorRefresh = anchorRefresh;
        this.quotaReconcile = quotaReconcile;
        this.metricsRollup = metricsRollup;
        this.dataCleanup = dataCleanup;
        this.logger = new common_1.Logger(SchedulerBootstrap_1.name);
    }
    async onModuleInit() {
        await this.pollSchedule.upsertJobScheduler('poll-schedule-tick', { every: 5000 }, { name: 'tick', data: {} });
        await this.anchorRefresh.upsertJobScheduler('anchor-refresh', { every: 6 * 3600_000 }, { name: 'refresh', data: {} });
        await this.quotaReconcile.upsertJobScheduler('quota-reconcile', { pattern: '0 3 * * *' }, { name: 'reconcile', data: {} });
        await this.metricsRollup.upsertJobScheduler('metrics-rollup', { every: 5 * 60_000 }, { name: 'rollup', data: {} });
        await this.dataCleanup.upsertJobScheduler('data-cleanup', { pattern: '0 4 * * 0' }, { name: 'cleanup', data: {} });
        this.logger.log('Worker repeatable jobs registered');
    }
};
exports.SchedulerBootstrap = SchedulerBootstrap;
exports.SchedulerBootstrap = SchedulerBootstrap = SchedulerBootstrap_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.POLL_SCHEDULE)),
    __param(1, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.ANCHOR_REFRESH)),
    __param(2, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.QUOTA_RECONCILE)),
    __param(3, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.METRICS_ROLLUP)),
    __param(4, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.DATA_CLEANUP)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue])
], SchedulerBootstrap);
let PollScheduleProcessor = PollScheduleProcessor_1 = class PollScheduleProcessor extends bullmq_1.WorkerHost {
    constructor(redis, anchorService, pollExecute) {
        super();
        this.redis = redis;
        this.anchorService = anchorService;
        this.pollExecute = pollExecute;
        this.logger = new common_1.Logger(PollScheduleProcessor_1.name);
    }
    async process(_job) {
        const lock = await this.redis.acquireLock('lock:poll-schedule', 4000);
        if (!lock)
            return;
        try {
            const due = await this.anchorService.listDue(200);
            const groups = new Map();
            for (const a of due) {
                const key = a.platform;
                if (!groups.has(key))
                    groups.set(key, []);
                groups.get(key).push(String(a._id));
            }
            for (const [platform, anchorIds] of groups) {
                const chunkSize = platform === 'bilibili' ? 20 : 10;
                for (let i = 0; i < anchorIds.length; i += chunkSize) {
                    const chunk = anchorIds.slice(i, i + chunkSize);
                    await this.pollExecute.add('execute', { platform, anchorIds: chunk });
                }
            }
        }
        finally {
            await this.redis.releaseLock('lock:poll-schedule', lock);
        }
    }
};
exports.PollScheduleProcessor = PollScheduleProcessor;
exports.PollScheduleProcessor = PollScheduleProcessor = PollScheduleProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.POLL_SCHEDULE),
    __param(2, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.POLL_EXECUTE)),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        anchor_service_1.AnchorService,
        bullmq_2.Queue])
], PollScheduleProcessor);
let PollExecuteProcessor = PollExecuteProcessor_1 = class PollExecuteProcessor extends bullmq_1.WorkerHost {
    constructor(anchorModel, crawler, liveService, pollExecute) {
        super();
        this.anchorModel = anchorModel;
        this.crawler = crawler;
        this.liveService = liveService;
        this.pollExecute = pollExecute;
        this.logger = new common_1.Logger(PollExecuteProcessor_1.name);
    }
    async process(job) {
        const { platform, anchorIds } = job.data;
        const anchors = await this.anchorModel.find({ _id: { $in: anchorIds } });
        const uids = anchors.map((a) => platform === 'douyin' && a.roomId ? a.roomId : a.platformUid);
        const { results, deferred, allFailed } = await this.crawler.fetchStatuses(platform, uids);
        if (deferred) {
            await this.pollExecute.add('execute', job.data, { delay: 2000 });
            return;
        }
        const byUid = new Map(results.map((r) => [r.platformUid, r]));
        for (const a of anchors) {
            const r = byUid.get(a.platformUid) ||
                (a.roomId ? byUid.get(a.roomId) : undefined);
            const status = r?.status ?? 'probe_failed';
            const failed = allFailed || status === 'probe_failed' || !r;
            const interval = failed
                ? PROBE_FAIL_RETRY_MS
                : TIER_INTERVAL_MS[a.pollTier] || 60_000;
            a.lastPolledAt = new Date(Date.now() + interval);
            await a.save();
            if (a.platform === 'douyin' && !a.roomId) {
                this.logger.warn(`douyin anchor ${a._id} missing roomId, probe may fail`);
            }
            await this.liveService.applyProbeResult(String(a._id), status, {
                provider: r?.provider || 'none',
                confidence: r?.confidence ?? 0,
                title: r?.title,
                coverUrl: r?.coverUrl,
                startedAt: r?.startedAt,
            });
        }
    }
};
exports.PollExecuteProcessor = PollExecuteProcessor;
exports.PollExecuteProcessor = PollExecuteProcessor = PollExecuteProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.POLL_EXECUTE),
    __param(0, (0, mongoose_1.InjectModel)(anchor_schema_1.Anchor.name)),
    __param(3, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.POLL_EXECUTE)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        crawler_service_1.CrawlerService,
        live_service_1.LiveService,
        bullmq_2.Queue])
], PollExecuteProcessor);
let PollConfirmProcessor = class PollConfirmProcessor extends bullmq_1.WorkerHost {
    constructor(anchorModel, crawler, liveService) {
        super();
        this.anchorModel = anchorModel;
        this.crawler = crawler;
        this.liveService = liveService;
    }
    async process(job) {
        const anchor = await this.anchorModel.findById(job.data.anchorId);
        if (!anchor)
            return;
        const probeId = anchor.platform === 'douyin' && anchor.roomId
            ? anchor.roomId
            : anchor.platformUid;
        const { results, allFailed } = await this.crawler.fetchStatuses(anchor.platform, [
            probeId,
        ]);
        if (allFailed || !results[0])
            return;
        const r = results[0];
        await this.liveService.applyProbeResult(String(anchor._id), r.status, {
            provider: r.provider,
            confidence: Math.max(r.confidence, 0.9),
            title: r.title,
            coverUrl: r.coverUrl,
        });
    }
};
exports.PollConfirmProcessor = PollConfirmProcessor;
exports.PollConfirmProcessor = PollConfirmProcessor = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.POLL_CONFIRM),
    __param(0, (0, mongoose_1.InjectModel)(anchor_schema_1.Anchor.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        crawler_service_1.CrawlerService,
        live_service_1.LiveService])
], PollConfirmProcessor);
let NotifyDispatchProcessor = class NotifyDispatchProcessor extends bullmq_1.WorkerHost {
    constructor(subscriptionService, notifySend) {
        super();
        this.subscriptionService = subscriptionService;
        this.notifySend = notifySend;
    }
    async process(job) {
        const subs = await this.subscriptionService.listEnabledByAnchor(job.data.anchorId);
        for (const s of subs) {
            await this.notifySend.add('send', {
                userId: String(s.userId),
                sessionId: job.data.sessionId,
                anchorId: job.data.anchorId,
            }, { jobId: `send:${job.data.sessionId}:${s.userId}` });
        }
    }
};
exports.NotifyDispatchProcessor = NotifyDispatchProcessor;
exports.NotifyDispatchProcessor = NotifyDispatchProcessor = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.NOTIFY_DISPATCH),
    __param(1, (0, bullmq_1.InjectQueue)(queues_1.QUEUE_NAMES.NOTIFY_SEND)),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService,
        bullmq_2.Queue])
], NotifyDispatchProcessor);
let NotifySendProcessor = class NotifySendProcessor extends bullmq_1.WorkerHost {
    constructor(notifyService) {
        super();
        this.notifyService = notifyService;
    }
    async process(job) {
        await this.notifyService.sendForUser(job.data);
    }
};
exports.NotifySendProcessor = NotifySendProcessor;
exports.NotifySendProcessor = NotifySendProcessor = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.NOTIFY_SEND),
    __metadata("design:paramtypes", [notify_service_1.NotifyService])
], NotifySendProcessor);
let AnchorRefreshProcessor = AnchorRefreshProcessor_1 = class AnchorRefreshProcessor extends bullmq_1.WorkerHost {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(AnchorRefreshProcessor_1.name);
    }
    async process() {
        this.logger.log('anchor-refresh tick');
    }
};
exports.AnchorRefreshProcessor = AnchorRefreshProcessor;
exports.AnchorRefreshProcessor = AnchorRefreshProcessor = AnchorRefreshProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.ANCHOR_REFRESH)
], AnchorRefreshProcessor);
let QuotaReconcileProcessor = QuotaReconcileProcessor_1 = class QuotaReconcileProcessor extends bullmq_1.WorkerHost {
    constructor(ledger, quota) {
        super();
        this.ledger = ledger;
        this.quota = quota;
        this.logger = new common_1.Logger(QuotaReconcileProcessor_1.name);
    }
    async process() {
        this.logger.log('quota-reconcile tick');
        const n = await this.quota.countDocuments();
        this.logger.log(`user_quota rows=${n}`);
    }
};
exports.QuotaReconcileProcessor = QuotaReconcileProcessor;
exports.QuotaReconcileProcessor = QuotaReconcileProcessor = QuotaReconcileProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.QUOTA_RECONCILE),
    __param(0, (0, mongoose_1.InjectModel)(quota_ledger_schema_1.QuotaLedger.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_quota_schema_1.UserQuota.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], QuotaReconcileProcessor);
let MetricsRollupProcessor = MetricsRollupProcessor_1 = class MetricsRollupProcessor extends bullmq_1.WorkerHost {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(MetricsRollupProcessor_1.name);
    }
    async process() {
        this.logger.debug('metrics-rollup tick');
    }
};
exports.MetricsRollupProcessor = MetricsRollupProcessor;
exports.MetricsRollupProcessor = MetricsRollupProcessor = MetricsRollupProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.METRICS_ROLLUP)
], MetricsRollupProcessor);
let DataCleanupProcessor = DataCleanupProcessor_1 = class DataCleanupProcessor extends bullmq_1.WorkerHost {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(DataCleanupProcessor_1.name);
    }
    async process() {
        this.logger.log('data-cleanup tick');
    }
};
exports.DataCleanupProcessor = DataCleanupProcessor;
exports.DataCleanupProcessor = DataCleanupProcessor = DataCleanupProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queues_1.QUEUE_NAMES.DATA_CLEANUP)
], DataCleanupProcessor);
//# sourceMappingURL=scheduler.processors.js.map