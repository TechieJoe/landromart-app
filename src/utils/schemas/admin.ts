import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "./enum.Roles";

@Schema()
export class admin{
   
    @Prop({required: true})
    name: string;

    @Prop({required: true, unique: true})
    email: string;

    @Prop({required: true})
    password: string;

    @Prop({ enum: Role, default: Role.ADMIN})
    role: Role;

}

export const adminSchema = SchemaFactory.createForClass(admin);