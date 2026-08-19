import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppApiModule } from './app.api.module';
import { RedisService } from './common/redis/redis.service';
import { setupSwagger } from './common/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppApiModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const redis = app.get(RedisService);
  await redis.connect().catch(() => undefined);

  setupSwagger(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('apiPort') || 4000;
  await app.listen(port);
}

bootstrap();
