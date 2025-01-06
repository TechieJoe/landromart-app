import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true })
  order: mongoose.Schema.Types.ObjectId; // Reference to the Order

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
