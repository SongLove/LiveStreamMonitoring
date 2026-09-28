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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQueryDto = exports.ApiResponseDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class ApiResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => Number }, message: { required: true, type: () => String }, data: { required: true }, traceId: { required: false, type: () => String } };
    }
}
exports.ApiResponseDto = ApiResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '业务状态码，0 表示成功' }),
    __metadata("design:type", Number)
], ApiResponseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ok' }),
    __metadata("design:type", String)
], ApiResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '业务数据' }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'trace-uuid', description: '链路追踪 ID' }),
    __metadata("design:type", String)
], ApiResponseDto.prototype, "traceId", void 0);
class PaginationQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number }, pageSize: { required: false, type: () => Number } };
    }
}
exports.PaginationQueryDto = PaginationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, default: 1 }),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20, default: 20 }),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "pageSize", void 0);
//# sourceMappingURL=api-response.dto.js.map