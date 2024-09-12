import { IsNotEmpty, IsString } from "class-validator";

export class servicesDto{

    @IsString()
    @IsNotEmpty()
    item: string;

    @IsString()
    @IsNotEmpty()
    ironingPrice: string;

    @IsString()
    @IsNotEmpty()
    washingPrice: string;
}