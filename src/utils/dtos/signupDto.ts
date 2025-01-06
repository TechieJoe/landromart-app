import { IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";

export class signupDto{

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional() 
    @IsString()
    profilePicture?: string; // This

}