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

export class RedemptionDto {
  @IsPositive()
  discountAmount: number;
}

export class PreviewOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsBoolean()
  delivery: boolean;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  offerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RedemptionDto)
  redemption?: RedemptionDto;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => RedemptionDto)
  redemption?: RedemptionDto;

  @IsOptional()
  @IsString()
  offerId?: string;
}
