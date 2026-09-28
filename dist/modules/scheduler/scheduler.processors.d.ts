import { OnModuleInit } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { RedisService } from '../../common/redis/redis.service';
import { AnchorService } from '../anchor/anchor.service';
import { CrawlerService } from '../crawler/crawler.service';
import { LiveService } from '../live/live.service';
import { NotifyService } from '../notify/notify.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { Model } from 'mongoose';
import { AnchorDocument } from '../anchor/anchor.schema';
import { QuotaLedgerDocument } from '../quota/quota-ledger.schema';
import { UserQuotaDocument } from '../quota/user-quota.schema';
export declare class SchedulerBootstrap implements OnModuleInit {
    private readonly pollSchedule;
    private readonly anchorRefresh;
    private readonly quotaReconcile;
    private readonly metricsRollup;
    private readonly dataCleanup;
    private readonly logger;
    constructor(pollSchedule: Queue, anchorRefresh: Queue, quotaReconcile: Queue, metricsRollup: Queue, dataCleanup: Queue);
    onModuleInit(): Promise<void>;
}
export declare class PollScheduleProcessor extends WorkerHost {
    private readonly redis;
    private readonly anchorService;
    private readonly pollExecute;
    private readonly logger;
    constructor(redis: RedisService, anchorService: AnchorService, pollExecute: Queue);
    process(_job: Job): Promise<void>;
}
export declare class PollExecuteProcessor extends WorkerHost {
    private readonly anchorModel;
    private readonly crawler;
    private readonly liveService;
    private readonly pollExecute;
    private readonly logger;
    constructor(anchorModel: Model<AnchorDocument>, crawler: CrawlerService, liveService: LiveService, pollExecute: Queue);
    process(job: Job<{
        platform: string;
        anchorIds: string[];
    }>): Promise<void>;
}
export declare class PollConfirmProcessor extends WorkerHost {
    private readonly anchorModel;
    private readonly crawler;
    private readonly liveService;
    constructor(anchorModel: Model<AnchorDocument>, crawler: CrawlerService, liveService: LiveService);
    process(job: Job<{
        anchorId: string;
    }>): Promise<void>;
}
export declare class NotifyDispatchProcessor extends WorkerHost {
    private readonly subscriptionService;
    private readonly notifySend;
    constructor(subscriptionService: SubscriptionService, notifySend: Queue);
    process(job: Job<{
        sessionId: string;
        anchorId: string;
    }>): Promise<void>;
}
export declare class NotifySendProcessor extends WorkerHost {
    private readonly notifyService;
    constructor(notifyService: NotifyService);
    process(job: Job<{
        userId: string;
        sessionId: string;
        anchorId: string;
    }>): Promise<void>;
}
export declare class AnchorRefreshProcessor extends WorkerHost {
    private readonly logger;
    process(): Promise<void>;
}
export declare class QuotaReconcileProcessor extends WorkerHost {
    private readonly ledger;
    private readonly quota;
    private readonly logger;
    constructor(ledger: Model<QuotaLedgerDocument>, quota: Model<UserQuotaDocument>);
    process(): Promise<void>;
}
export declare class MetricsRollupProcessor extends WorkerHost {
    private readonly logger;
    process(): Promise<void>;
}
export declare class DataCleanupProcessor extends WorkerHost {
    private readonly logger;
    process(): Promise<void>;
}
