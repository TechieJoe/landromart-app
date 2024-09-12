import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Profile extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  bio?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
