import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  customizations?: string;
}
