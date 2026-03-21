import { IsEnum, IsUUID } from 'class-validator';

export enum DayName {
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
}

export enum PlanMealType {
  BREAKFAST = 'BREAKFAST',
  SNACK = 'SNACK',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SUHUR = 'SUHUR',
}

export class AddMealToPlanDto {
  @IsEnum(DayName)
  day: DayName;

  @IsEnum(PlanMealType)
  type: PlanMealType;

  @IsUUID()
  mealId: string;
}

export class RemoveMealFromPlanDto {
  @IsEnum(DayName)
  day: DayName;

  @IsEnum(PlanMealType)
  type: PlanMealType;

  @IsUUID()
  mealId: string;
}

export class ReplaceMealInPlanDto {
  @IsEnum(DayName)
  day: DayName;

  @IsEnum(PlanMealType)
  type: PlanMealType;

  @IsUUID()
  oldMealId: string;

  @IsUUID()
  newMealId: string;
}
