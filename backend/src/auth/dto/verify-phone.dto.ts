import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPhoneDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
