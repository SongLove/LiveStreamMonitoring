import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuotaLedgerDocument = HydratedDocument<QuotaLedger>;

export type QuotaLedgerType = 'grant' | 'deduct' | 'refund' | 'adjust';

@Schema({ timestamps: true, collection: 'quota_ledger' })
export class QuotaLedger {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  type!: QuotaLedgerType;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, unique: true })
  idempotencyKey!: string;

  @Prop({ default: '' })
  templateId!: string;

  @Prop({ default: '' })
  reason!: string;

  @Prop({ type: Object, default: {} })
  meta!: Record<string, unknown>;
}

export const QuotaLedgerSchema = SchemaFactory.createForClass(QuotaLedger);
