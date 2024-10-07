import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Order } from './order';
import { Transaction } from './transaction';

@Schema()
export class User {

  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiration?: Date;

  // Relationship with Orders
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }] })
  orders: Order[];

  // Relationship with Transactions
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }] })
  transactions: Transaction[];
}

export const userSchema = SchemaFactory.createForClass(User);
