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
exports.AdminController = exports.ResendNotifyDto = exports.BanUserDto = exports.AdjustQuotaDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_admin_guard_1 = require("../../common/guards/jwt-admin.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_service_1 = require("../user/user.service");
const quota_service_1 = require("../quota/quota.service");
const anchor_service_1 = require("../anchor/anchor.service");
const crawler_service_1 = require("../crawler/crawler.service");
const notify_service_1 = require("../notify/notify.service");
const subscription_service_1 = require("../subscription/subscription.service");
const category_service_1 = require("../category/category.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./audit-log.schema");
const mask_1 = require("../../common/utils/mask");
const crypto_1 = require("crypto");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
class AdjustQuotaDto {
}
exports.AdjustQuotaDto = AdjustQuotaDto;
__decorate([
    (0, swagger_2.ApiProperty)({ example: 10, description: '正数增加，负数扣减' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdjustQuotaDto.prototype, "delta", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: '客服补偿', minLength: 2 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], AdjustQuotaDto.prototype, "reason", void 0);
class BanUserDto {
}
exports.BanUserDto = BanUserDto;
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'true 封禁，false 解封' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BanUserDto.prototype, "banned", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ minLength: 2 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], BanUserDto.prototype, "reason", void 0);
class ResendNotifyDto {
}
exports.ResendNotifyDto = ResendNotifyDto;
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'notify_logs._id' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResendNotifyDto.prototype, "notifyLogId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ minLength: 2 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ResendNotifyDto.prototype, "reason", void 0);
let AdminController = class AdminController {
    constructor(userService, quotaService, anchorService, crawlerService, notifyService, subscriptionService, categoryService, auditModel) {
        this.userService = userService;
        this.quotaService = quotaService;
        this.anchorService = anchorService;
        this.crawlerService = crawlerService;
        this.notifyService = notifyService;
        this.subscriptionService = subscriptionService;
        this.categoryService = categoryService;
        this.auditModel = auditModel;
    }
    async audit(adminId, action, targetType, targetId, reason, before = {}, after = {}) {
        await this.auditModel.create({
            adminId,
            action,
            targetType,
            targetId,
            reason,
            before,
            after,
        });
    }
    async users(page, pageSize, status) {
        const result = await this.userService.listForAdmin({
            page: parseInt(page || '1', 10),
            pageSize: parseInt(pageSize || '20', 10),
            status,
        });
        return {
            ...result,
            items: result.items.map((u) => ({
                ...u,
                openid: (0, mask_1.maskOpenId)(u.openid),
            })),
        };
    }
    async userDetail(id) {
        const profile = await this.userService.getProfile(id);
        const user = await this.userService.findById(id);
        const quota = await this.quotaService.getSnapshot(id);
        const subscriptions = await this.subscriptionService.list(id);
        const categories = await this.categoryService.list(id);
        const notifyLogs = await this.notifyService.listForUser(id, 1, 20);
        return {
            profile: { ...profile, openid: (0, mask_1.maskOpenId)(user.openid) },
            quota,
            subscriptions,
            categories,
            notifyLogs,
        };
    }
    async ban(admin, id, body) {
        const before = await this.userService.findById(id);
        const after = await this.userService.ban(id, body.banned);
        await this.audit(admin.adminId, body.banned ? 'user.ban' : 'user.unban', 'user', id, body.reason, { status: before.status }, { status: after?.status });
        return { ok: true };
    }
    async adjustQuota(admin, id, body) {
        const before = await this.quotaService.getSnapshot(id);
        const after = await this.quotaService.adjust(id, body.delta, `adjust:${id}:${(0, crypto_1.randomUUID)()}`, body.reason);
        await this.audit(admin.adminId, 'quota.adjust', 'user', id, body.reason, before, after);
        return after;
    }
    async resend(admin, body) {
        await this.audit(admin.adminId, 'notify.resend', 'notify_log', body.notifyLogId, body.reason);
        return { ok: true, message: 'Resend queued (manual milestone path)' };
    }
    anchors(page, pageSize) {
        return this.anchorService.adminList(parseInt(page || '1', 10), parseInt(pageSize || '20', 10));
    }
    providersHealth() {
        return this.crawlerService.healthSummary();
    }
    async auditLogs(page, pageSize) {
        const p = parseInt(page || '1', 10);
        const ps = parseInt(pageSize || '20', 10);
        const [items, total] = await Promise.all([
            this.auditModel
                .find()
                .sort({ createdAt: -1 })
                .skip((p - 1) * ps)
                .limit(ps)
                .lean(),
            this.auditModel.countDocuments(),
        ]);
        return { items, total, page: p, pageSize: ps };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)('super_admin', 'user_support', 'ops_audit'),
    (0, swagger_1.ApiOperation)({ summary: '用户列表', description: 'openid 脱敏展示' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['active', 'banned', 'deleting'] }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "users", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'user_support', 'ops_audit'),
    (0, swagger_1.ApiOperation)({
        summary: '用户详情',
        description: '只读：关注、分类、额度、推送记录；默认不允许代改分类/订阅',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'users._id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "userDetail", null);
__decorate([
    (0, common_1.Post)('users/:id/ban'),
    (0, roles_decorator_1.Roles)('super_admin', 'user_support'),
    (0, swagger_1.ApiOperation)({ summary: '封禁/解封用户', description: '必须填写 reason，写入 audit_logs' }),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, BanUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "ban", null);
__decorate([
    (0, common_1.Post)('users/:id/quota/adjust'),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: '人工调整额度', description: 'super_admin；写入账本与审计' }),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, AdjustQuotaDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustQuota", null);
__decorate([
    (0, common_1.Post)('notify/resend'),
    (0, roles_decorator_1.Roles)('super_admin', 'user_support'),
    (0, swagger_1.ApiOperation)({ summary: '补发推送', description: '记录审计；V1 为里程碑 stub' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ResendNotifyDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resend", null);
__decorate([
    (0, common_1.Get)('anchors'),
    (0, roles_decorator_1.Roles)('super_admin', 'content_ops', 'ops_audit'),
    (0, swagger_1.ApiOperation)({ summary: '主播池列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "anchors", null);
__decorate([
    (0, common_1.Get)('providers/health'),
    (0, roles_decorator_1.Roles)('super_admin', 'ops_audit'),
    (0, swagger_1.ApiOperation)({
        summary: 'Provider 健康摘要',
        description: '不含完整 Cookie/签名凭证',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "providersHealth", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)('super_admin', 'ops_audit'),
    (0, swagger_1.ApiOperation)({ summary: '操作审计日志' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "auditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('管理后台'),
    (0, swagger_1.ApiBearerAuth)('admin-jwt'),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/admin'),
    __param(7, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [user_service_1.UserService,
        quota_service_1.QuotaService,
        anchor_service_1.AnchorService,
        crawler_service_1.CrawlerService,
        notify_service_1.NotifyService,
        subscription_service_1.SubscriptionService,
        category_service_1.CategoryService,
        mongoose_2.Model])
], AdminController);
//# sourceMappingURL=admin.controller.js.map