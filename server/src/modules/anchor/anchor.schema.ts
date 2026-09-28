import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnchorDocument = HydratedDocument<Anchor>;

export type AnchorLiveState = 'offline' | 'pending_confirm' | 'live';
export type Platform = 'bilibili' | 'douyin' | 'kuaishou';

@Schema({ timestamps: true, collection: 'anchors' })
export class Anchor {
  @Prop({ required: true, index: true })
  platform!: Platform;

  @Prop({ required: true })
  platformUid!: string;

  @Prop({ default: '' })
  roomId!: string;

  @Prop({ default: '' })
  nickname!: string;

  @Prop({ default: '' })
  avatarUrl!: string;

  @Prop({ default: '' })
  profileUrl!: string;

  @Prop({ default: '' })
  liveTitle!: string;

  @Prop({ default: '' })
  coverUrl!: string;

  @Prop({ default: 'offline' })
  liveState!: AnchorLiveState;

  @Prop({ default: 0 })
  followerCount!: number;

  @Prop({ default: 2 })
  pollTier!: number;

  @Prop({ type: Date, default: null })
  lastPolledAt!: Date | null;

  @Prop({ default: 'active' })
  status!: 'active' | 'paused' | 'invalid';

  @Prop({ default: 0 })
  consecutiveOffline!: number;

  /** 连续探测失败次数；达阈值后强制下播，避免 live 卡死 */
  @Prop({ default: 0 })
  consecutiveProbeFailed!: number;

  @Prop({ type: Date, default: null })
  lastLiveAt!: Date | null;

  @Prop({ default: 0 })
  subscriberCount!: number;
}

export const AnchorSchema = SchemaFactory.createForClass(Anchor);
AnchorSchema.index({ platform: 1, platformUid: 1 }, { unique: true });
AnchorSchema.index({ status: 1, pollTier: 1, lastPolledAt: 1 });
