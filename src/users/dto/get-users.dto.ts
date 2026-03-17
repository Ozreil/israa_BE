import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class GetUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
