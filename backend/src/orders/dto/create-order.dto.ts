import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { PaymentMethod } from '../../../shared/enums';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  customizations?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsBoolean()
  delivery: boolean;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
