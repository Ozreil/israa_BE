import { PlanStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
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

  /** Set to save the plan for a patient; omit to create a template. */
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}
