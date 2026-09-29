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
exports.UserController = exports.UpdateSettingsDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const user_service_1 = require("./user.service");
const quota_service_1 = require("../quota/quota.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
class UpdateSettingsDto {
}
exports.UpdateSettingsDto = UpdateSettingsDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: '推送总开关' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "notifyEnabled", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: '免打扰开关' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "dndEnabled", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '23:00', description: '免打扰开始 HH:mm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSettingsDto.prototype, "dndStart", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '08:00', description: '免打扰结束 HH:mm，可跨零点' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSettingsDto.prototype, "dndEnd", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: '学生党模式（仅节假日推送）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "studentMode", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 30, description: '同主播冷却分钟数' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateSettingsDto.prototype, "cooldownMinutes", void 0);
let UserController = class UserController {
    constructor(userService, quotaService) {
        this.userService = userService;
        this.quotaService = quotaService;
    }
    async profile(user) {
        const profile = await this.userService.getProfile(user.userId);
        const quota = await this.quotaService.getSnapshot(user.userId);
        return { ...profile, quota: { balance: quota.balance, maxBalance: quota.maxBalance } };
    }
    async settings(user, body) {
        return this.userService.updateSettings(user.userId, body);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户资料', description: '返回资料、设置摘要与额度余额' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "profile", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, swagger_1.ApiOperation)({ summary: '更新推送设置', description: '总开关、免打扰、学生党、冷却时间' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateSettingsDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "settings", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('小程序-用户'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1/user'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        quota_service_1.QuotaService])
], UserController);
//# sourceMappingURL=user.controller.js.map