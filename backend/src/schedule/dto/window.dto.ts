import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';
import { ShiftType } from '../../../shared/enums';

export class CreateScheduleWindowDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsEnum(ShiftType)
  shift: ShiftType;

  @IsString()
  @IsNotEmpty()
  openTime: string;

  @IsString()
  @IsNotEmpty()
  closeTime: string;

  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateScheduleWindowDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsEnum(ShiftType)
  shift?: ShiftType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  openTime?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  closeTime?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
