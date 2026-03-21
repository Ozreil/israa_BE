import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { GetPlansDto } from './dto/get-plans.dto';
import {
  AddMealToPlanDto,
  RemoveMealFromPlanDto,
  ReplaceMealInPlanDto,
} from './dto/modify-plan-meal.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly db: DatabaseService) {}

  async addMeal(id: string, dto: AddMealToPlanDto) {
    await this.ensureMealExists(dto.mealId);
    const { plan, days } = await this.getEditableDays(id);
    const slot = this.findMealSlot(days, dto.day, dto.type);

    if (slot.items.includes(dto.mealId)) {
      throw new BadRequestException('Meal already exists in this day and type');
    }

    slot.items.push(dto.mealId);

    return this.db.plan.update({
      where: { id: plan.id },
      data: { days: this.toJson(days) },
    });
  }

  async removeMeal(id: string, dto: RemoveMealFromPlanDto) {
    const { plan, days } = await this.getEditableDays(id);
    const slot = this.findMealSlot(days, dto.day, dto.type);
    const itemIndex = slot.items.indexOf(dto.mealId);

    if (itemIndex === -1) {
      throw new BadRequestException('Meal does not exist in this day and type');
    }

    slot.items.splice(itemIndex, 1);

    return this.db.plan.update({
      where: { id: plan.id },
      data: { days: this.toJson(days) },
    });
  }

  async replaceMeal(id: string, dto: ReplaceMealInPlanDto) {
    await this.ensureMealExists(dto.newMealId);
    const { plan, days } = await this.getEditableDays(id);
    const slot = this.findMealSlot(days, dto.day, dto.type);
    const itemIndex = slot.items.indexOf(dto.oldMealId);

    if (itemIndex === -1) {
      throw new BadRequestException('Old meal does not exist in this day and type');
    }

    slot.items[itemIndex] = dto.newMealId;

    return this.db.plan.update({
      where: { id: plan.id },
      data: { days: this.toJson(days) },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  create(dto: CreatePlanDto) {
    return this.db.plan.create({
      data: {
        calories: dto.calories ?? null,
        tags: this.toJson(dto.tags ?? []),
        sourceFile: dto.sourceFile?.trim() || null,
        days: this.toJson(dto.days),
      },
    });
  }

  async findAll(query: GetPlansDto) {
    const useClosestCalories =
      query.calories !== undefined && query.closestCalories === true;

    const where: Prisma.PlanWhereInput = {
      sourceFile: query.sourceFile
        ? {
            contains: query.sourceFile,
            mode: 'insensitive',
          }
        : undefined,
      calories:
        query.calories !== undefined && !useClosestCalories
          ? query.calories
          : undefined,
    };

    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    if (query.tag || useClosestCalories) {
      const allItems = await this.db.plan.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      let filtered = allItems;

      if (query.tag) {
        const normalizedTag = query.tag.trim().toLowerCase();
        filtered = filtered.filter((plan) =>
          this.planHasTag(plan.tags, normalizedTag),
        );
      }

      if (useClosestCalories) {
        const targetCalories = query.calories as number;
        filtered = filtered
          .filter((plan) => typeof plan.calories === 'number')
          .sort((a, b) => {
            const diffA = Math.abs((a.calories as number) - targetCalories);
            const diffB = Math.abs((b.calories as number) - targetCalories);

            if (diffA !== diffB) {
              return diffA - diffB;
            }

            return b.createdAt.getTime() - a.createdAt.getTime();
          });
      }

      const paged = filtered.slice(skip, skip + take);
      const resolvedItems = query.expandMeals
        ? await this.expandMealsForPlans(paged)
        : paged;

      return {
        items: resolvedItems,
        total: filtered.length,
        skip,
        take,
      };
    }

    const [items, total] = await Promise.all([
      this.db.plan.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.db.plan.count({ where }),
    ]);

    const resolvedItems = query.expandMeals
      ? await this.expandMealsForPlans(items)
      : items;

    return {
      items: resolvedItems,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, expandMeals = false) {
    const plan = await this.db.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} was not found`);
    }

    if (!expandMeals) {
      return plan;
    }

    const [resolved] = await this.expandMealsForPlans([plan]);
    return resolved;
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.ensureExists(id);

    return this.db.plan.update({
      where: { id },
      data: {
        calories: dto.calories,
        tags: dto.tags === undefined ? undefined : this.toJson(dto.tags),
        sourceFile: dto.sourceFile?.trim(),
        days: dto.days === undefined ? undefined : this.toJson(dto.days),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.db.plan.delete({
      where: { id },
    });

    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const plan = await this.db.plan.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} was not found`);
    }
  }

  private async ensureMealExists(mealId: string) {
    const meal = await this.db.meal.findUnique({
      where: { id: mealId },
      select: { id: true },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with id ${mealId} was not found`);
    }
  }

  private async getEditableDays(id: string) {
    const plan = await this.db.plan.findUnique({
      where: { id },
      select: {
        id: true,
        days: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} was not found`);
    }

    if (!Array.isArray(plan.days)) {
      throw new BadRequestException('Plan days data is not in the expected format');
    }

    return {
      plan,
      days: plan.days as DayNode[],
    };
  }

  private findMealSlot(days: DayNode[], day: string, type: string) {
    const dayNode = days.find((item) => item.day === day);
    if (!dayNode) {
      throw new NotFoundException(`Day "${day}" does not exist in this plan`);
    }

    if (!Array.isArray(dayNode.meals)) {
      throw new BadRequestException(`Day "${day}" has invalid meals structure`);
    }

    const mealSlot = dayNode.meals.find((item) => item.type === type);
    if (!mealSlot) {
      throw new NotFoundException(`Meal type "${type}" not found in day "${day}"`);
    }

    if (!Array.isArray(mealSlot.items)) {
      throw new BadRequestException(
        `Meal type "${type}" has invalid items structure`,
      );
    }

    return mealSlot;
  }

  private planHasTag(tags: unknown, expectedTag: string) {
    if (!Array.isArray(tags)) {
      return false;
    }

    return tags.some((tag) => {
      if (typeof tag !== 'string') {
        return false;
      }

      return tag.toLowerCase() === expectedTag;
    });
  }

  private async expandMealsForPlans<T extends { days: unknown }>(plans: T[]) {
    const mealIds = this.extractMealIds(plans);

    if (mealIds.length === 0) {
      return plans;
    }

    const meals = await this.db.meal.findMany({
      where: { id: { in: mealIds } },
      select: {
        id: true,
        meal: true,
        protein: true,
        fat: true,
        carbs: true,
        calories: true,
      },
    });

    const mealMap = new Map(meals.map((meal) => [meal.id, meal]));

    return plans.map((plan) => ({
      ...plan,
      days: this.replaceMealIdsWithMeals(plan.days, mealMap),
    }));
  }

  private extractMealIds(plans: Array<{ days: unknown }>) {
    const ids = new Set<string>();

    for (const plan of plans) {
      if (!Array.isArray(plan.days)) {
        continue;
      }

      for (const day of plan.days) {
        const dayObj =
          typeof day === 'object' && day !== null
            ? (day as { meals?: unknown })
            : null;
        if (!dayObj || !Array.isArray(dayObj.meals)) {
          continue;
        }

        for (const mealSlot of dayObj.meals) {
          const mealSlotObj =
            typeof mealSlot === 'object' && mealSlot !== null
              ? (mealSlot as { items?: unknown })
              : null;
          if (!mealSlotObj || !Array.isArray(mealSlotObj.items)) {
            continue;
          }

          for (const item of mealSlotObj.items) {
            if (typeof item === 'string') {
              ids.add(item);
            }
          }
        }
      }
    }

    return [...ids];
  }

  private replaceMealIdsWithMeals(
    days: unknown,
    mealMap: Map<
      string,
      {
        id: string;
        meal: string;
        protein: number | null;
        fat: number | null;
        carbs: number | null;
        calories: number | null;
      }
    >,
  ) {
    if (!Array.isArray(days)) {
      return days;
    }

    return days.map((day) => {
      if (typeof day !== 'object' || day === null) {
        return day;
      }

      const meals = (day as { meals?: unknown }).meals;
      if (!Array.isArray(meals)) {
        return day;
      }

      const nextMeals = meals.map((mealSlot) => {
        if (typeof mealSlot !== 'object' || mealSlot === null) {
          return mealSlot;
        }

        const items = (mealSlot as { items?: unknown }).items;
        if (!Array.isArray(items)) {
          return mealSlot;
        }

        const nextItems = items.map((item) => {
          if (typeof item !== 'string') {
            return item;
          }

          const meal = mealMap.get(item);
          if (!meal) {
            return { id: item, missing: true };
          }

          return meal;
        });

        return {
          ...(mealSlot as Record<string, unknown>),
          items: nextItems,
        };
      });

      return {
        ...(day as Record<string, unknown>),
        meals: nextMeals,
      };
    });
  }
}

type DayMealNode = {
  type: string;
  items: string[];
};

type DayNode = {
  day: string;
  meals: DayMealNode[];
};
