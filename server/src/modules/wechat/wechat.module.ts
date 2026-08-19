import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WechatTokenService } from './wechat-token.service';
import { WechatService } from './wechat.service';
import { WechatController } from './wechat.controller';
import { QuotaModule } from '../quota/quota.module';
import { UserModule } from '../user/user.module';
import { NotifyLog, NotifyLogSchema } from '../notify/notify-log.schema';

@Module({
  imports: [
    QuotaModule,
    forwardRef(() => UserModule),
    MongooseModule.forFeature([{ name: NotifyLog.name, schema: NotifyLogSchema }]),
  ],
  providers: [WechatTokenService, WechatService],
  controllers: [WechatController],
  exports: [WechatService, WechatTokenService],
})
export class WechatModule {}
