import { IsPositive } from 'class-validator';

export class UpdateCartDto {
  @IsPositive()
  quantity: number;
}
