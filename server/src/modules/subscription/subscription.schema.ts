import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  anchorId!: Types.ObjectId;

  @Prop({ default: true })
  enabled!: boolean;

  @Prop({ type: [Types.ObjectId], default: [] })
  categoryIds!: Types.ObjectId[];

  @Prop({ default: '' })
  remark!: string;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: false })
  deleted!: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ userId: 1, anchorId: 1 }, { unique: true });
SubscriptionSchema.index({ anchorId: 1, enabled: 1 });
SubscriptionSchema.index({ userId: 1, enabled: 1, sortOrder: 1 });
