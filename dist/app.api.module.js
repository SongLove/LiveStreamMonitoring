"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppApiModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const nestjs_pino_1 = require("nestjs-pino");
const configuration_1 = __importDefault(require("./config/configuration"));
const redis_module_1 = require("./common/redis/redis.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/response/transform.interceptor");
const jwt_client_guard_1 = require("./common/guards/jwt-client.guard");
const jwt_admin_guard_1 = require("./common/guards/jwt-admin.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const user_module_1 = require("./modules/user/user.module");
const anchor_module_1 = require("./modules/anchor/anchor.module");
const category_module_1 = require("./modules/category/category.module");
const subscription_module_1 = require("./modules/subscription/subscription.module");
const quota_module_1 = require("./modules/quota/quota.module");
const wechat_module_1 = require("./modules/wechat/wechat.module");
const crawler_module_1 = require("./modules/crawler/crawler.module");
const live_module_1 = require("./modules/live/live.module");
const notify_module_1 = require("./modules/notify/notify.module");
const admin_module_1 = require("./modules/admin/admin.module");
const health_module_1 = require("./modules/health/health.module");
const bull_board_module_1 = require("./modules/bull-board/bull-board.module");
const queues_1 = require("./common/constants/queues");
const domainImports = [
    auth_module_1.AuthModule,
    user_module_1.UserModule,
    anchor_module_1.AnchorModule,
    category_module_1.CategoryModule,
    subscription_module_1.SubscriptionModule,
    quota_module_1.QuotaModule,
    wechat_module_1.WechatModule,
    crawler_module_1.CrawlerModule,
    live_module_1.LiveModule,
    notify_module_1.NotifyModule,
    admin_module_1.AdminModule,
    health_module_1.HealthModule,
];
let AppApiModule = class AppApiModule {
};
exports.AppApiModule = AppApiModule;
exports.AppApiModule = AppApiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                    redact: [
                        'req.headers.authorization',
                        'session_key',
                        '*.session_key',
                        '*.cookie',
                    ],
                },
            }),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    uri: config.get('mongodbUri'),
                }),
            }),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: config.get('redis.host'),
                        port: config.get('redis.port'),
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue(...queues_1.ALL_QUEUE_NAMES.map((name) => ({ name }))),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            jwt_1.JwtModule.register({ global: true }),
            redis_module_1.RedisModule,
            ...domainImports,
            bull_board_module_1.BullBoardModule,
        ],
        providers: [
            jwt_client_guard_1.JwtClientGuard,
            jwt_admin_guard_1.JwtAdminGuard,
            roles_guard_1.RolesGuard,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.AllExceptionsFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: transform_interceptor_1.TransformInterceptor },
        ],
        exports: [jwt_1.JwtModule],
    })
], AppApiModule);
//# sourceMappingURL=app.api.module.js.map