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
exports.AuthController = exports.AdminLoginResponseDto = exports.ClientLoginResponseDto = exports.AdminLoginDto = exports.ClientLoginDto = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const auth_service_1 = require("./auth.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
class ClientLoginDto {
}
exports.ClientLoginDto = ClientLoginDto;
__decorate([
    (0, swagger_2.ApiProperty)({ example: '081xxx', description: 'wx.login() 返回的临时 code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClientLoginDto.prototype, "code", void 0);
class AdminLoginDto {
}
exports.AdminLoginDto = AdminLoginDto;
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'admin' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "username", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'admin123456', minLength: 6 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "password", void 0);
class ClientLoginResponseDto {
}
exports.ClientLoginResponseDto = ClientLoginResponseDto;
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'JWT，后续请求 Header: Authorization Bearer <token>' }),
    __metadata("design:type", String)
], ClientLoginResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    __metadata("design:type", String)
], ClientLoginResponseDto.prototype, "userId", void 0);
class AdminLoginResponseDto {
}
exports.AdminLoginResponseDto = AdminLoginResponseDto;
__decorate([
    (0, swagger_2.ApiProperty)(),
    __metadata("design:type", String)
], AdminLoginResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    __metadata("design:type", String)
], AdminLoginResponseDto.prototype, "adminId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ type: [String], example: ['super_admin'] }),
    __metadata("design:type", Array)
], AdminLoginResponseDto.prototype, "roles", void 0);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async clientLogin(body) {
        return this.authService.clientLogin(body.code);
    }
    async adminLogin(body) {
        try {
            return await this.authService.adminLogin(body.username, body.password);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('api/v1/auth/login'),
    (0, swagger_1.ApiTags)('小程序-认证'),
    (0, swagger_1.ApiOperation)({ summary: '小程序微信登录', description: '用 code 换 openid 并签发 Client JWT；不返回 session_key' }),
    (0, swagger_1.ApiBody)({ type: ClientLoginDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '登录成功', type: (api_response_dto_1.ApiResponseDto) }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClientLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "clientLogin", null);
__decorate([
    (0, common_1.Post)('api/admin/auth/login'),
    (0, swagger_1.ApiTags)('管理后台'),
    (0, swagger_1.ApiOperation)({ summary: '管理后台登录', description: '独立于小程序 JWT 的后台认证' }),
    (0, swagger_1.ApiBody)({ type: AdminLoginDto }),
    (0, swagger_1.ApiResponse)({ status: 201, type: (api_response_dto_1.ApiResponseDto) }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '账号或密码错误' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map