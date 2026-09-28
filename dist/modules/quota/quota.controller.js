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
exports.QuotaController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const quota_service_1 = require("./quota.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
let QuotaController = class QuotaController {
    constructor(quotaService) {
        this.quotaService = quotaService;
    }
    async get(user) {
        const snap = await this.quotaService.getSnapshot(user.userId);
        const ledger = await this.quotaService.listLedger(user.userId, 10);
        return { ...snap, recentLedger: ledger };
    }
    async refresh(user) {
        return this.quotaService.refreshReadOnly(user.userId);
    }
    async forgeGrant() {
        this.quotaService.rejectClientGrant();
    }
};
exports.QuotaController = QuotaController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '查询额度与最近流水',
        description: '返回 balance、maxBalance 与 recentLedger',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotaController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({
        summary: '刷新额度展示',
        description: '只读查询，**不会**发放额度；发放仅来自微信订阅回调',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotaController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('grant'),
    (0, swagger_1.ApiOperation)({
        summary: '（禁止）Client 伪造发放',
        description: '始终拒绝，用于验收 Client 不能自行加次数',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Quota grant only via WeChat callback' }),
    openapi.ApiResponse({ status: 201 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuotaController.prototype, "forgeGrant", null);
exports.QuotaController = QuotaController = __decorate([
    (0, swagger_1.ApiTags)('小程序-额度'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1/quota'),
    __metadata("design:paramtypes", [quota_service_1.QuotaService])
], QuotaController);
//# sourceMappingURL=quota.controller.js.map