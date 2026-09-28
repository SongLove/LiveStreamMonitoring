"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const mongoose_1 = require("@nestjs/mongoose");
const queues_1 = require("../../common/constants/queues");
const scheduler_processors_1 = require("./scheduler.processors");
const anchor_module_1 = require("../anchor/anchor.module");
const crawler_module_1 = require("../crawler/crawler.module");
const live_module_1 = require("../live/live.module");
const notify_module_1 = require("../notify/notify.module");
const subscription_module_1 = require("../subscription/subscription.module");
const anchor_schema_1 = require("../anchor/anchor.schema");
const quota_ledger_schema_1 = require("../quota/quota-ledger.schema");
const user_quota_schema_1 = require("../quota/user-quota.schema");
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue(...queues_1.ALL_QUEUE_NAMES.map((name) => ({ name }))),
            mongoose_1.MongooseModule.forFeature([
                { name: anchor_schema_1.Anchor.name, schema: anchor_schema_1.AnchorSchema },
                { name: quota_ledger_schema_1.QuotaLedger.name, schema: quota_ledger_schema_1.QuotaLedgerSchema },
                { name: user_quota_schema_1.UserQuota.name, schema: user_quota_schema_1.UserQuotaSchema },
            ]),
            anchor_module_1.AnchorModule,
            crawler_module_1.CrawlerModule,
            live_module_1.LiveModule,
            notify_module_1.NotifyModule,
            subscription_module_1.SubscriptionModule,
        ],
        providers: [
            scheduler_processors_1.SchedulerBootstrap,
            scheduler_processors_1.PollScheduleProcessor,
            scheduler_processors_1.PollExecuteProcessor,
            scheduler_processors_1.PollConfirmProcessor,
            scheduler_processors_1.NotifyDispatchProcessor,
            scheduler_processors_1.NotifySendProcessor,
            scheduler_processors_1.AnchorRefreshProcessor,
            scheduler_processors_1.QuotaReconcileProcessor,
            scheduler_processors_1.MetricsRollupProcessor,
            scheduler_processors_1.DataCleanupProcessor,
        ],
        exports: [bullmq_1.BullModule],
    })
], SchedulerModule);
//# sourceMappingURL=scheduler.module.js.map