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
exports.WechatController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wechat_service_1 = require("./wechat.service");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const config_1 = require("@nestjs/config");
const wechat_callback_parse_1 = require("./wechat-callback.parse");
let WechatController = class WechatController {
    constructor(wechatService, config) {
        this.wechatService = wechatService;
        this.config = config;
    }
    verify(query, res) {
        if (!this.wechatService.verifyCallbackSignature(query)) {
            return res.status(403).send('invalid signature');
        }
        return res.status(200).send(query.echostr || 'ok');
    }
    async callback(req, query, res) {
        if (!this.wechatService.verifyCallbackSignature(query)) {
            return res.status(403).send('invalid signature');
        }
        const raw = req.body;
        const parsed = (0, wechat_callback_parse_1.parseWechatCallbackBody)(raw);
        const event = parsed.event.toLowerCase();
        if (event.includes('subscribe_msg') && event.includes('sent')) {
            await this.wechatService.handleNotifyResultCallback(typeof raw === 'object' && raw != null && !Array.isArray(raw) ? raw : parsed);
        }
        else {
            await this.wechatService.handleSubscribeCallback(raw);
        }
        return res.status(200).send('success');
    }
    async mockSubscribeAccept(user, body) {
        if (!this.wechatService.isMockMode()) {
            throw new common_1.ForbiddenException('已配置 WECHAT_APPID：额度只能由微信服务器回调发放');
        }
        const status = String(body?.status || 'accept').toLowerCase();
        if (status !== 'accept') {
            return { granted: false, reason: status, balance: null };
        }
        const templateId = body?.templateId ||
            this.config.get('wechat.subscribeTemplateId') ||
            'TMPL_LIVE_NOTIFY';
        return this.wechatService.mockGrantAccept(user.userId, templateId);
    }
};
exports.WechatController = WechatController;
__decorate([
    (0, common_1.Get)('callback'),
    (0, swagger_1.ApiOperation)({
        summary: '微信服务器 URL 验证',
        description: '配置小程序服务器地址时的 GET 验签；返回 echostr',
    }),
    (0, swagger_1.ApiQuery)({ name: 'signature', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'timestamp', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'nonce', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'echostr', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '验签成功返回 echostr' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '签名无效' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WechatController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('callback'),
    (0, swagger_1.ApiOperation)({
        summary: '微信事件推送',
        description: '订阅弹窗结果（发放额度）、拒收、下发回执。支持单对象/数组列表归一化。此接口由微信服务器调用，非 Client。',
    }),
    (0, swagger_1.ApiQuery)({ name: 'signature', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'timestamp', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'nonce', required: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '处理成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WechatController.prototype, "callback", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '（仅本地 mock）模拟订阅授权到账',
        description: '仅当未配置 WECHAT_APPID 时可用；生产环境禁止。额度仍走 grantFromWechatCallback。' }),
    (0, common_1.Post)('mock-subscribe-accept'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, swagger_1.ApiResponse)({ status: 201, description: '模拟发放结果' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WechatController.prototype, "mockSubscribeAccept", null);
exports.WechatController = WechatController = __decorate([
    (0, swagger_1.ApiTags)('微信回调'),
    (0, common_1.Controller)('api/v1/wechat'),
    __metadata("design:paramtypes", [wechat_service_1.WechatService,
        config_1.ConfigService])
], WechatController);
//# sourceMappingURL=wechat.controller.js.map