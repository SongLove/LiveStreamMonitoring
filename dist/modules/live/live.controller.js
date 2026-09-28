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
exports.LiveController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_client_guard_1 = require("../../common/guards/jwt-client.guard");
const live_service_1 = require("./live.service");
const api_response_dto_1 = require("../../common/swagger/api-response.dto");
let LiveController = class LiveController {
    constructor(liveService) {
        this.liveService = liveService;
    }
    sessions(user, page, pageSize) {
        return this.liveService.listForUser(user.userId, parseInt(page || '1', 10), parseInt(pageSize || '20', 10));
    }
};
exports.LiveController = LiveController;
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: '历史开播会话', description: '直播回放/历史动态列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, example: 20 }),
    (0, swagger_1.ApiResponse)({ status: 200, type: api_response_dto_1.ApiResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "sessions", null);
exports.LiveController = LiveController = __decorate([
    (0, swagger_1.ApiTags)('小程序-直播'),
    (0, swagger_1.ApiBearerAuth)('client-jwt'),
    (0, common_1.UseGuards)(jwt_client_guard_1.JwtClientGuard),
    (0, common_1.Controller)('api/v1/live'),
    __metadata("design:paramtypes", [live_service_1.LiveService])
], LiveController);
//# sourceMappingURL=live.controller.js.map