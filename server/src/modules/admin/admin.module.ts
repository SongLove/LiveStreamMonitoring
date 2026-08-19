import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admin.schema';
import { AuditLog, AuditLogSchema } from './audit-log.schema';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { QuotaModule } from '../quota/quota.module';
import { AnchorModule } from '../anchor/anchor.module';
import { CrawlerModule } from '../crawler/crawler.module';
import { NotifyModule } from '../notify/notify.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    UserModule,
    QuotaModule,
    AnchorModule,
    CrawlerModule,
    NotifyModule,
    SubscriptionModule,
    CategoryModule,
  ],
  controllers: [AdminController],
  exports: [MongooseModule],
})
export class AdminModule {}
