import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { QUEUE_NAMES, ALL_QUEUE_NAMES } from '../../common/constants/queues';
import {
  SchedulerBootstrap,
  PollScheduleProcessor,
  PollExecuteProcessor,
  PollConfirmProcessor,
  NotifyDispatchProcessor,
  NotifySendProcessor,
  AnchorRefreshProcessor,
  QuotaReconcileProcessor,
  MetricsRollupProcessor,
  DataCleanupProcessor,
} from './scheduler.processors';
import { AnchorModule } from '../anchor/anchor.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { LiveModule } from '../live/live.module';
import { NotifyModule } from '../notify/notify.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { Anchor, AnchorSchema } from '../anchor/anchor.schema';
import { QuotaLedger, QuotaLedgerSchema } from '../quota/quota-ledger.schema';
import { UserQuota, UserQuotaSchema } from '../quota/user-quota.schema';

@Module({
  imports: [
    BullModule.registerQueue(...ALL_QUEUE_NAMES.map((name) => ({ name }))),
    MongooseModule.forFeature([
      { name: Anchor.name, schema: AnchorSchema },
      { name: QuotaLedger.name, schema: QuotaLedgerSchema },
      { name: UserQuota.name, schema: UserQuotaSchema },
    ]),
    AnchorModule,
    CrawlerModule,
    LiveModule,
    NotifyModule,
    SubscriptionModule,
  ],
  providers: [
    SchedulerBootstrap,
    PollScheduleProcessor,
    PollExecuteProcessor,
    PollConfirmProcessor,
    NotifyDispatchProcessor,
    NotifySendProcessor,
    AnchorRefreshProcessor,
    QuotaReconcileProcessor,
    MetricsRollupProcessor,
    DataCleanupProcessor,
  ],
  exports: [BullModule],
})
export class SchedulerModule {}
