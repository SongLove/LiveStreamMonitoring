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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyController = exports.NotifyTestDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const throttler_1 = require("@nestjs/throttler");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const notify_service_1 = require("./notify.service");
const config_1 = require("@nestjs/config");
const wechat_service_1 = require("../wechat/wechat.service");
const user_service_1 = require("../user/user.service");
const quota_service_1 = require("../quota/quota.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
const live_notify_data_1 = require("./live-notify-data");
class NotifyTestDto {
}
exports.NotifyTestDto = NotifyTestDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '测试开播提醒', description: '模板 thing 字段内容' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyTestDto.prototype, "message", void 0);
let NotifyController = class NotifyController {
    constructor(notifyService, wechatService, userService, quotaService, config) {
        this.notifyService = notifyService;
        this.wechatService = wechatService;
        this.userService = userService;
        this.quotaService = quotaService;
        this.config = config;
    }
    logs(user, page, pageSize) {
        return this.notifyService.listForUser(user.userId, parseInt(page || '1', 10), parseInt(pageSize || '20', 10));
    }
    async test(user, body) {
        const templateId = this.config.get('wechat.subscribeTemplateId') || 'TMPL_LIVE_NOTIFY';
        const u = await this.userService.findById(user.userId);
        const snap = await this.quotaService.getSnapshot(user.userId);
        if (snap.balance <= 0) {
            return { ok: false, reason: 'quota_insufficient' };
        }
        const deductKey = `deduct:test:${user.userId}:${Date.now()}`;
        const ok = await this.quotaService.deduct(user.userId, deductKey, 'manual_test');
        if (!ok)
            return { ok: false, reason: 'quota_insufficient' };
        const result = await this.wechatService.sendSubscribeMessage({
            openid: u.openid,
            templateId,
            page: 'pages/index/index',
            data: (0, live_notify_data_1.buildLiveNotifyData)({
                anchorName: this.wechatService.truncateField(body.message || '测试主播'),
                topic: '测试直播',
                remark: '测试推送',
                time: (0, live_notify_data_1.formatSubscribeTime)(),
            }),
        });
        if (result.errcode !== 0 && this.wechatService.shouldRefundError(result.errcode)) {
            await this.quotaService.refund(user.userId, `refund:test:${deductKey}`, 'test_fail');
        }
        return { ok: result.errcode === 0, result };
    }
    async diagnose(user) {
        const u = await this.userService.findById(user.userId);
        const quota = await this.quotaService.getSnapshot(user.userId);
        return {
            status: u.status,
            templateAuth: u.templateAuth,
            notifyEnabled: u.settings.notifyEnabled,
            quota,
        };
    }
    faq() {
        return {
            items: [
                { q: '如何获得推送次数？', a: '在小程序内授权订阅消息，微信回调后自动发放。' },
                { q: '为什么没有收到提醒？', a: '请检查总开关、免打扰、额度与模板授权状态。' },
                {
                    q: '如何添加抖音主播？',
                    a: '输入抖音号（用户 ID，如 kelie329157）搜索添加。不支持按昵称搜索。',
                },
            ],
        };
    }
    appConfig() {
        return {
            templates: {
                liveNotify: this.config.get('wechat.subscribeTemplateId'),
            },
            features: { studentMode: true },
        };
    }
};
exports.NotifyController = NotifyController;
__decorate([
    (0, common_1.Get)('notify/logs'),
    (0, swagger_1.ApiOperation)({ summary: '推送记录', description: '含跳过原因与微信错误码' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, example: 20 }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], NotifyController.prototype, "logs", null);
__decorate([
    (0, common_1.Post)('notify/test'),
    (0, swagger_1.ApiOperation)({
        summary: '发送测试推送',
        description: '走完整扣减与微信下发；限流 3 次/分钟',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, NotifyTestDto]),
    __metadata("design:returntype", Promise)
], NotifyController.prototype, "test", null);
__decorate([
    (0, common_1.Get)('diagnose/auth'),
    (0, swagger_1.ApiOperation)({ summary: '检查订阅权限', description: '模板授权状态与修复指引数据' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotifyController.prototype, "diagnose", null);
__decorate([
    (0, common_1.Get)('help/faq'),
    (0, swagger_1.ApiOperation)({ summary: '帮助中心 FAQ' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotifyController.prototype, "faq", null);
__decorate([
    (0, common_1.Get)('config/app'),
    (0, swagger_1.ApiOperation)({ summary: '客户端配置下发', description: '模板 ID、功能开关；不含密钥' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotifyController.prototype, "appConfig", null);
exports.NotifyController = NotifyController = __decorate([
    (0, swagger_1.ApiTags)('小程序-推送'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [notify_service_1.NotifyService,
        wechat_service_1.WechatService,
        user_service_1.UserService,
        quota_service_1.QuotaService,
        config_1.ConfigService])
], NotifyController);
//# sourceMappingURL=notify.controller.js.map