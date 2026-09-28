"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const nestjs_pino_1 = require("nestjs-pino");
const app_worker_module_1 = require("./app.worker.module");
const redis_service_1 = require("./common/redis/redis.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_worker_module_1.AppWorkerModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const redis = app.get(redis_service_1.RedisService);
    await redis.connect().catch(() => undefined);
}
bootstrap();
//# sourceMappingURL=main.worker.js.map