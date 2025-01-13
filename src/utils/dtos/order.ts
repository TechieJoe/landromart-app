import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  item: string; // Renamed from orders to item

  @IsString()
  action: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  total: number;
}

export class CreateOrderDto {

  @IsString()
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  reference: string;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orders: OrderItemDto[];

  @IsNumber()
  grandTotal: number;

  @IsOptional()
  metadata?: Record<string, any>;
  
}
