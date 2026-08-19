import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AdminRole } from '../../common/decorators/roles.decorator';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true, collection: 'admins' })
export class Admin {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: [String], default: [] })
  roles!: AdminRole[];

  @Prop({ default: true })
  enabled!: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
