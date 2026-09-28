"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const notify_log_schema_1 = require("./notify-log.schema");
const live_session_schema_1 = require("../live/live-session.schema");
const notify_service_1 = require("./notify.service");
const notify_controller_1 = require("./notify.controller");
const user_module_1 = require("../user/user.module");
const quota_module_1 = require("../quota/quota.module");
const wechat_module_1 = require("../wechat/wechat.module");
const subscription_module_1 = require("../subscription/subscription.module");
const anchor_module_1 = require("../anchor/anchor.module");
let NotifyModule = class NotifyModule {
};
exports.NotifyModule = NotifyModule;
exports.NotifyModule = NotifyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: notify_log_schema_1.NotifyLog.name, schema: notify_log_schema_1.NotifyLogSchema },
                { name: live_session_schema_1.LiveSession.name, schema: live_session_schema_1.LiveSessionSchema },
            ]),
            user_module_1.UserModule,
            quota_module_1.QuotaModule,
            (0, common_1.forwardRef)(() => wechat_module_1.WechatModule),
            subscription_module_1.SubscriptionModule,
            anchor_module_1.AnchorModule,
        ],
        providers: [notify_service_1.NotifyService],
        controllers: [notify_controller_1.NotifyController],
        exports: [notify_service_1.NotifyService, mongoose_1.MongooseModule],
    })
], NotifyModule);
//# sourceMappingURL=notify.module.js.map