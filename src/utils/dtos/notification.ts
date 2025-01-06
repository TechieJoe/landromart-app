import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  read?: boolean;
}
