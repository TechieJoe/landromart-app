// src/payment/dto/create-payment.dto.ts
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
  
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
