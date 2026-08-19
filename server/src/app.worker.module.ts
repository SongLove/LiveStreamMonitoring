import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { RedisModule } from './common/redis/redis.module';
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
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { HealthModule } from './modules/health/health.module';
import { ALL_QUEUE_NAMES } from './common/constants/queues';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: ['req.headers.authorization', 'session_key', '*.session_key'],
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
    JwtModule.register({ global: true }),
    RedisModule,
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
    SchedulerModule,
    HealthModule,
  ],
})
export class AppWorkerModule {}
