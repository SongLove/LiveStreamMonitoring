import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LiveSessionDocument = HydratedDocument<LiveSession>;

@Schema({ timestamps: true, collection: 'live_sessions' })
export class LiveSession {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  anchorId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  sessionKey!: string;

  @Prop({ required: true })
  platform!: string;

  @Prop({ type: Date, required: true })
  startedAt!: Date;

  @Prop({ type: Date, default: null })
  endedAt!: Date | null;

  @Prop({ default: 'live' })
  status!: 'live' | 'ended';

  @Prop({ default: '' })
  provider!: string;

  @Prop({ default: 0 })
  detectLatencyMs!: number;

  @Prop({ default: '' })
  title!: string;

  @Prop({ default: '' })
  coverUrl!: string;
}

export const LiveSessionSchema = SchemaFactory.createForClass(LiveSession);

/** Build unique session key: anchorId + live start floored to minute. */
export function buildSessionKey(anchorId: string, startedAt: Date): string {
  const floored = new Date(startedAt);
  floored.setSeconds(0, 0);
  return `${anchorId}:${floored.toISOString()}`;
}
