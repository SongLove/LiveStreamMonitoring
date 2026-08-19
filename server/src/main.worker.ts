import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppWorkerModule } from './app.worker.module';
import { RedisService } from './common/redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppWorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const redis = app.get(RedisService);
  await redis.connect().catch(() => undefined);
  // Keep process alive — BullMQ workers run via @Processor providers
}

bootstrap();
