import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformConfigDocument = HydratedDocument<PlatformConfig>;

@Schema({ timestamps: true, collection: 'platform_configs' })
export class PlatformConfig {
  @Prop({ required: true })
  platform!: string;

  @Prop({ required: true })
  provider!: string;

  @Prop({ default: true })
  enabled!: boolean;

  @Prop({ default: 1 })
  priority!: number;

  @Prop({ type: Object, default: {} })
  settings!: Record<string, unknown>;
}

export const PlatformConfigSchema = SchemaFactory.createForClass(PlatformConfig);
PlatformConfigSchema.index({ platform: 1, provider: 1 }, { unique: true });
