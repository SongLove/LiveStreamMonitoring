import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  adminId!: Types.ObjectId;

  @Prop({ required: true })
  action!: string;

  @Prop({ default: '' })
  targetType!: string;

  @Prop({ default: '' })
  targetId!: string;

  @Prop({ type: Object, default: {} })
  before!: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  after!: Record<string, unknown>;

  @Prop({ required: true })
  reason!: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
