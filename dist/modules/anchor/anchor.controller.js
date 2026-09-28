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
exports.AnchorController = exports.ResolveAnchorDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const throttler_1 = require("@nestjs/throttler");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const anchor_service_1 = require("./anchor.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
class ResolveAnchorDto {
}
exports.ResolveAnchorDto = ResolveAnchorDto;
__decorate([
    (0, swagger_2.ApiProperty)({ enum: ['bilibili', 'douyin', 'kuaishou'], example: 'kuaishou' }),
    (0, class_validator_1.IsIn)(['bilibili', 'douyin', 'kuaishou']),
    __metadata("design:type", String)
], ResolveAnchorDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({
        example: 'https://live.bilibili.com/12345',
        description: '关键词、平台 ID、直播间链接或分享文案',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveAnchorDto.prototype, "input", void 0);
let AnchorController = class AnchorController {
    constructor(anchorService) {
        this.anchorService = anchorService;
    }
    async search(platform, q) {
        return this.anchorService.search(platform || 'bilibili', q || '');
    }
    async resolve(body) {
        return this.anchorService.resolve(body.platform, body.input);
    }
    async pool() {
        return { sets: [], message: 'Recommendation pool stub for V1' };
    }
    async detail(id) {
        return this.anchorService.findById(id);
    }
};
exports.AnchorController = AnchorController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: '搜索主播', description: '先查本地池，未命中可调 Provider 解析（限流）' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', enum: ['bilibili', 'douyin', 'kuaishou'], required: false }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: '搜索关键词', example: '某某主播' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    __param(0, (0, common_1.Query)('platform')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnchorController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('resolve'),
    (0, swagger_1.ApiOperation)({ summary: '解析主播链接/ID', description: '归一化输入并入库或复用全局主播' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: api_response_dto_1.ApiResponseDto }),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResolveAnchorDto]),
    __metadata("design:returntype", Promise)
], AnchorController.prototype, "resolve", null);
__decorate([
    (0, common_1.Get)('pool'),
    (0, swagger_1.ApiOperation)({ summary: '主播广场推荐', description: 'V1 返回 stub，V1.1 接推荐专题' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnchorController.prototype, "pool", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '主播详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'anchors 集合 _id' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnchorController.prototype, "detail", null);
exports.AnchorController = AnchorController = __decorate([
    (0, swagger_1.ApiTags)('小程序-主播'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1/anchors'),
    __metadata("design:paramtypes", [anchor_service_1.AnchorService])
], AnchorController);
//# sourceMappingURL=anchor.controller.js.map