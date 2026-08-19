import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { RedisModule } from './common/redis/redis.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/response/transform.interceptor';
import { JwtClientGuard } from './common/guards/jwt-client.guard';
import { JwtAdminGuard } from './common/guards/jwt-admin.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AnchorModule } from './modules/anchor/anchor.module';
import { CategoryModule } from './modules/category/category.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { QuotaModule } from './modules/quota/quota.module';
import { WechatModule } from './modules/wechat/wechat.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { LiveModule } from './modules/live/live.module';
import { NotifyModule } from './modules/notify/notify.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { BullBoardModule } from './modules/bull-board/bull-board.module';
import { ALL_QUEUE_NAMES } from './common/constants/queues';

const domainImports = [
  AuthModule,
  UserModule,
  AnchorModule,
  CategoryModule,
  SubscriptionModule,
  QuotaModule,
  WechatModule,
  CrawlerModule,
  LiveModule,
  NotifyModule,
  AdminModule,
  HealthModule,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: [
          'req.headers.authorization',
          'session_key',
          '*.session_key',
          '*.cookie',
        ],
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodbUri'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
        },
      }),
    }),
    BullModule.registerQueue(...ALL_QUEUE_NAMES.map((name) => ({ name }))),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({ global: true }),
    RedisModule,
    ...domainImports,
    BullBoardModule,
  ],
  providers: [
    JwtClientGuard,
    JwtAdminGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
  exports: [JwtModule],
})
export class AppApiModule {}
