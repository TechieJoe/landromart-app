import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  orders: string;

  @IsString()
  action: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  total: number;
}

export class CreateCartDto {

  @IsString()
  @IsNotEmpty()
  email: string;
  
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orders: OrderItemDto[];

  @IsNumber()
  grandTotal: number;
}


export class UpdateCartDto {
  
  @IsString()
  @IsNotEmpty()
  orderId: string;
  
  @IsString()
  itemId: string;

  @IsNumber()
  quantity: number;

}
