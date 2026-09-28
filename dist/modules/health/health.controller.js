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
exports.HealthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const terminus_1 = require("@nestjs/terminus");
const redis_service_1 = require("../../common/redis/redis.service");
let HealthController = class HealthController {
    constructor(health, mongo, redis) {
        this.health = health;
        this.mongo = mongo;
        this.redis = redis;
    }
    check() {
        return this.health.check([
            () => this.mongo.pingCheck('mongodb'),
            async () => {
                try {
                    await this.redis.client.ping();
                    return { redis: { status: 'up' } };
                }
                catch (e) {
                    throw e;
                }
            },
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '健康检查', description: 'MongoDB + Redis 探针' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '服务健康' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: '依赖不可用' }),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('系统'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.MongooseHealthIndicator,
        redis_service_1.RedisService])
], HealthController);
//# sourceMappingURL=health.controller.js.map