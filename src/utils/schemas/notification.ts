import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;

}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
