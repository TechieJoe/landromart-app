import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  reference: string;


  @Prop([{
    item: { type: String, required: true },
    action: { type: String, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
  }])
  orders: Array<{
    item: string;
    action: string;
    quantity: number;
    total: number;
  }>;

  @Prop({ required: true })
  grandTotal: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
