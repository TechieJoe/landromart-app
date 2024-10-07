// src/profile/dto/update-profile.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name?: string;

  @IsOptional() 
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  email?: string;

  @IsOptional() 
  @IsString()
  profilePicture?: string; // This

}