import { ILLNESSES, Role } from '../types';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  age: number;

  @IsEnum(Role, {
    message: 'Valid role is requried',
  })
  role: Role;

  @IsEmail()
  email: string;

  @IsArray()
  @IsNumber({}, { each: true })
  weights: number[];

  @IsArray()
  @IsEnum(ILLNESSES, {
    each: true,
    message: 'Valid Illness is requried',
  })
  illnesses: ILLNESSES[];
}
