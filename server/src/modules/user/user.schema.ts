import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export type UserStatus = 'active' | 'banned' | 'deleting';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, index: true })
  openid!: string;

  @Prop({ default: '' })
  nickname!: string;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ default: 'active' })
  status!: UserStatus;

  @Prop({
    type: Object,
    default: () => ({
      notifyEnabled: true,
      dndEnabled: false,
      dndStart: '23:00',
      dndEnd: '08:00',
      studentMode: false,
      cooldownMinutes: 0,
    }),
  })
  settings!: {
    notifyEnabled: boolean;
    dndEnabled: boolean;
    dndStart: string;
    dndEnd: string;
    studentMode: boolean;
    cooldownMinutes: number;
  };

  @Prop({
    type: Object,
    default: () => ({}),
  })
  templateAuth!: Record<string, 'accept' | 'reject' | 'unknown'>;

  @Prop({ type: Date, default: Date.now })
  lastActiveAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ status: 1, lastActiveAt: -1 });
