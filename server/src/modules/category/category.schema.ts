import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<UserAnchorCategory>;

@Schema({ timestamps: true, collection: 'user_anchor_categories' })
export class UserAnchorCategory {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: '#4A90E2' })
  color!: string;

  @Prop({ default: '' })
  icon!: string;

  @Prop({ default: 0 })
  sortOrder!: number;

  @Prop({ default: false })
  deleted!: boolean;
}

export const UserAnchorCategorySchema = SchemaFactory.createForClass(UserAnchorCategory);
UserAnchorCategorySchema.index({ userId: 1, name: 1 }, { unique: true });
UserAnchorCategorySchema.index({ userId: 1, sortOrder: 1 });
