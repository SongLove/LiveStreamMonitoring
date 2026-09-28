"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_schema_1 = require("./admin.schema");
const audit_log_schema_1 = require("./audit-log.schema");
const admin_controller_1 = require("./admin.controller");
const user_module_1 = require("../user/user.module");
const quota_module_1 = require("../quota/quota.module");
const anchor_module_1 = require("../anchor/anchor.module");
const crawler_module_1 = require("../crawler/crawler.module");
const notify_module_1 = require("../notify/notify.module");
const subscription_module_1 = require("../subscription/subscription.module");
const category_module_1 = require("../category/category.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema },
                { name: audit_log_schema_1.AuditLog.name, schema: audit_log_schema_1.AuditLogSchema },
            ]),
            user_module_1.UserModule,
            quota_module_1.QuotaModule,
            anchor_module_1.AnchorModule,
            crawler_module_1.CrawlerModule,
            notify_module_1.NotifyModule,
            subscription_module_1.SubscriptionModule,
            category_module_1.CategoryModule,
        ],
        controllers: [admin_controller_1.AdminController],
        exports: [mongoose_1.MongooseModule],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map