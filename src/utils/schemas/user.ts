import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Order } from './order';
import { Notification } from './notification';

@Schema()
export class user {
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiration?: Date;

  // Relationship with Orders
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }] })
  orders: Order[];

  // Relationship with Notifications
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }] })
  notifications: Notification[];
}

export const userSchema = SchemaFactory.createForClass(user);
