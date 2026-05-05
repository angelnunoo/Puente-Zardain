import { IsEmail, IsString, IsNumber, Min } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  password: string;

  @IsString()
  name: string;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsString()
  description?: string;
}

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsString()
  paymentMethod: string;
}