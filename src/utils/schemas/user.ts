import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "./enum.Roles";
import { Order } from "./order";
import mongoose from "mongoose";


@Schema()

export class User{

  _id: string;

  @Prop({ required: true})
  name: string;

  @Prop({ unique: true, required: true})
  email: string;

  @Prop({ required: true})
  password: string;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiration?: Date;

  //@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]})
  //order: Order[];
    
}

export const userSchema = SchemaFactory.createForClass(User)




