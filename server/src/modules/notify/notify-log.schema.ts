import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotifyLogDocument = HydratedDocument<NotifyLog>;

@Schema({ timestamps: true, collection: 'notify_logs' })
export class NotifyLog {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  sessionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  anchorId!: Types.ObjectId;

  @Prop({ required: true })
  templateId!: string;

  @Prop({ default: 'pending' })
  state!: 'pending' | 'skipped' | 'sent' | 'failed' | 'success';

  @Prop({ default: '' })
  skipReason!: string;

  @Prop({ default: '' })
  wxMsgId!: string;

  @Prop({ default: '' })
  finalStatus!: string;

  @Prop({ type: Object, default: {} })
  receipt!: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  payload!: Record<string, unknown>;
}

export const NotifyLogSchema = SchemaFactory.createForClass(NotifyLog);
NotifyLogSchema.index({ userId: 1, sessionId: 1, templateId: 1 }, { unique: true });
NotifyLogSchema.index({ userId: 1, createdAt: -1 });
NotifyLogSchema.index({ state: 1, createdAt: -1 });
