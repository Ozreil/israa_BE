import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  calories?: number;

  @IsOptional()
  @IsArray()
  tags?: unknown[];

  @IsOptional()
  @IsString()
  sourceFile?: string;

  @IsArray()
  days: unknown[];
}
