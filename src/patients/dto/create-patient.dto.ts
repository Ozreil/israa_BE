import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsPhoneNumber()
  phone: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  currentWeight: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  targetWeight: number;

  @IsString()
  @IsNotEmpty()
  activityLevel: string;

  @IsString()
  @IsNotEmpty()
  goal: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
