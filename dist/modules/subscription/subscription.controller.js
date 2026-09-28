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
exports.SubscriptionController = exports.BatchSubscriptionDto = exports.PatchSubscriptionDto = exports.CreateSubscriptionDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const subscription_service_1 = require("./subscription.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
class CreateSubscriptionDto {
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, swagger_2.ApiProperty)({ description: '全局主播 anchors._id' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "anchorId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ type: [String], description: '可选分类 ID 列表' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSubscriptionDto.prototype, "categoryIds", void 0);
class PatchSubscriptionDto {
}
exports.PatchSubscriptionDto = PatchSubscriptionDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatchSubscriptionDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PatchSubscriptionDto.prototype, "remark", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], PatchSubscriptionDto.prototype, "categoryIds", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchSubscriptionDto.prototype, "sortOrder", void 0);
class BatchSubscriptionDto {
}
exports.BatchSubscriptionDto = BatchSubscriptionDto;
__decorate([
    (0, swagger_2.ApiProperty)({ type: [String], maxItems: 100 }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BatchSubscriptionDto.prototype, "ids", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BatchSubscriptionDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BatchSubscriptionDto.prototype, "categoryIds", void 0);
let SubscriptionController = class SubscriptionController {
    constructor(subscriptionService) {
        this.subscriptionService = subscriptionService;
    }
    list(user) {
        return this.subscriptionService.list(user.userId);
    }
    add(user, body) {
        return this.subscriptionService.add(user.userId, body.anchorId, body.categoryIds || []);
    }
    update(user, id, body) {
        return this.subscriptionService.update(user.userId, id, body);
    }
    remove(user, id) {
        return this.subscriptionService.remove(user.userId, id);
    }
    batch(user, body) {
        return this.subscriptionService.batch(user.userId, body);
    }
};
exports.SubscriptionController = SubscriptionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '我的监听列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '添加监听', description: '幂等：同一主播不重复创建' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionController.prototype, "add", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新订阅', description: '开关、备注、排序、分类' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'subscriptions._id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, PatchSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '取消监听', description: '软删除，保留历史推送关联' }),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SubscriptionController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, swagger_1.ApiOperation)({ summary: '批量开关/归类' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, BatchSubscriptionDto]),
    __metadata("design:returntype", void 0)
], SubscriptionController.prototype, "batch", null);
exports.SubscriptionController = SubscriptionController = __decorate([
    (0, swagger_1.ApiTags)('小程序-订阅'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1/subscriptions'),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService])
], SubscriptionController);
//# sourceMappingURL=subscription.controller.js.map