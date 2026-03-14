import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMealDto {
  @IsString()
  @IsNotEmpty()
  meal: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  protein?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carbs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  calories?: number;
}
