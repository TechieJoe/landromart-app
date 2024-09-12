// src/payment/schemas/payment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document{

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  reference: string;

  @Prop({ required: true })
  userId: string;
  
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const transactionSchema = SchemaFactory.createForClass(Transaction);
