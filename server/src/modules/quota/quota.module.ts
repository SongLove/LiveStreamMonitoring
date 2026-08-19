import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotaLedger, QuotaLedgerSchema } from './quota-ledger.schema';
import { UserQuota, UserQuotaSchema } from './user-quota.schema';
import { QuotaService } from './quota.service';
import { QuotaController } from './quota.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuotaLedger.name, schema: QuotaLedgerSchema },
      { name: UserQuota.name, schema: UserQuotaSchema },
    ]),
  ],
  providers: [QuotaService],
  controllers: [QuotaController],
  exports: [QuotaService, MongooseModule],
})
export class QuotaModule {}
