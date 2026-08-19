import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotifyLog, NotifyLogSchema } from './notify-log.schema';
import { LiveSession, LiveSessionSchema } from '../live/live-session.schema';
import { NotifyService } from './notify.service';
import { NotifyController } from './notify.controller';
import { UserModule } from '../user/user.module';
import { QuotaModule } from '../quota/quota.module';
import { WechatModule } from '../wechat/wechat.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AnchorModule } from '../anchor/anchor.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotifyLog.name, schema: NotifyLogSchema },
      { name: LiveSession.name, schema: LiveSessionSchema },
    ]),
    UserModule,
    QuotaModule,
    forwardRef(() => WechatModule),
    SubscriptionModule,
    AnchorModule,
  ],
  providers: [NotifyService],
  controllers: [NotifyController],
  exports: [NotifyService, MongooseModule],
})
export class NotifyModule {}
