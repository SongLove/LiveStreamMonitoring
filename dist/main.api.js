"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nestjs_pino_1 = require("nestjs-pino");
const express_1 = require("express");
const app_api_module_1 = require("./app.api.module");
const redis_service_1 = require("./common/redis/redis.service");
const setup_swagger_1 = require("./common/swagger/setup-swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_api_module_1.AppApiModule, { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use('/api/v1/wechat/callback', (0, express_1.text)({
        type: ['text/xml', 'application/xml', 'text/plain', 'application/json'],
        limit: '1mb',
    }));
    app.use((0, express_1.json)({ limit: '1mb' }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const redis = app.get(redis_service_1.RedisService);
    await redis.connect().catch(() => undefined);
    (0, setup_swagger_1.setupSwagger)(app);
    const config = app.get(config_1.ConfigService);
    const port = config.get('apiPort') || 4000;
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.api.js.map