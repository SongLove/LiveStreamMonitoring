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
exports.CategoryController = exports.BatchAssignCategoryDto = exports.CreateCategoryDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const category_service_1 = require("./category.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
class CreateCategoryDto {
}
exports.CreateCategoryDto = CreateCategoryDto;
__decorate([
    (0, swagger_2.ApiProperty)({ example: '常看', maxLength: 20 }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: '#FF5722' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "color", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'star' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "icon", void 0);
class BatchAssignCategoryDto {
}
exports.BatchAssignCategoryDto = BatchAssignCategoryDto;
__decorate([
    (0, swagger_2.ApiProperty)({ type: [String], maxItems: 100, description: 'subscriptions._id 列表' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BatchAssignCategoryDto.prototype, "subscriptionIds", void 0);
let CategoryController = class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    list(user) {
        return this.categoryService.list(user.userId);
    }
    create(user, body) {
        return this.categoryService.create(user.userId, body);
    }
    update(user, id, body) {
        return this.categoryService.update(user.userId, id, body);
    }
    remove(user, id) {
        return this.categoryService.remove(user.userId, id);
    }
    batchAssign(user, id, body) {
        return this.categoryService.batchAssign(user.userId, id, body.subscriptionIds);
    }
};
exports.CategoryController = CategoryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '我的分类列表', description: '含每类主播数量；未分类为虚拟视图' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CategoryController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建 DIY 分类' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '修改分类' }),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除分类', description: '只清分类关系，不取消监听' }),
    (0, swagger_1.ApiParam)({ name: 'id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CategoryController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/subscriptions'),
    (0, swagger_1.ApiOperation)({ summary: '批量归入分类' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'categories._id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, BatchAssignCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoryController.prototype, "batchAssign", null);
exports.CategoryController = CategoryController = __decorate([
    (0, swagger_1.ApiTags)('小程序-分类'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1/categories'),
    __metadata("design:paramtypes", [category_service_1.CategoryService])
], CategoryController);
//# sourceMappingURL=category.controller.js.map