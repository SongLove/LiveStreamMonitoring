import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserQuotaDocument = HydratedDocument<UserQuota>;

@Schema({ timestamps: true, collection: 'user_quota' })
export class UserQuota {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ default: 0 })
  balance!: number;

  @Prop({ default: 200 })
  maxBalance!: number;
}

export const UserQuotaSchema = SchemaFactory.createForClass(UserQuota);
