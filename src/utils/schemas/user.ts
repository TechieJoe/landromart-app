import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Order } from './order';
import { Cart } from './cart';
import { Notification } from './notification';

@Schema()
export class user {
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  address?: string;

  @Prop({ required: true })
  password: string;

  profilePicture?: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiration?: Date;

  // Relationship with Orders
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }] })
  orders: Order[];

  // Relationship with Cart
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Cart' })
  cart: Cart[]; // Each user has a single cart

  // Relationship with Notifications
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }] })
  notifications: Notification[];
}

export const userSchema = SchemaFactory.createForClass(user);
