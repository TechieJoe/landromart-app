import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class loginDto{

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsNotEmpty()
    password: string;
}