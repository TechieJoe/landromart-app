import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document {

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  reference: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  // Reference to Order schema (multiple orders could be linked to one transaction)
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], required: true })
  orderIds: mongoose.Schema.Types.ObjectId[];

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const transactionSchema = SchemaFactory.createForClass(Transaction);
