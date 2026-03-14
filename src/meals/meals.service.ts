import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { AutocompleteMealsDto } from './dto/autocomplete-meals.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { GetMealsDto } from './dto/get-meals.dto';
import { UpdateMealDto } from './dto/update-meal.dto';

@Injectable()
export class MealsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateMealDto) {
    try {
      return await this.db.meal.create({
        data: {
          meal: dto.meal.trim(),
          protein: dto.protein ?? null,
          carbs: dto.carbs ?? null,
          fat: dto.fat ?? null,
          calories: dto.calories ?? null,
        },
      });
    } catch (error) {
      this.handleKnownError(error, dto.meal);
    }
  }

  async findAll(query: GetMealsDto) {
    const where: Prisma.MealWhereInput = query.search
      ? {
          meal: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
      : {};

    const skip = query.skip ?? 0;
    const take = query.take ?? 50;

    const [items, total] = await Promise.all([
      this.db.meal.findMany({
        where,
        skip,
        take,
        orderBy: {
          meal: 'asc',
        },
      }),
      this.db.meal.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async autocomplete(query: AutocompleteMealsDto) {
    const items = await this.db.meal.findMany({
      where: {
        meal: {
          contains: query.term.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        meal: true,
      },
      take: query.limit,
      orderBy: {
        meal: 'asc',
      },
    });

    return items;
  }

  async findOne(id: string) {
    const meal = await this.db.meal.findUnique({
      where: { id },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with id ${id} was not found`);
    }

    return meal;
  }

  async update(id: string, dto: UpdateMealDto) {
    await this.ensureExists(id);

    try {
      return await this.db.meal.update({
        where: { id },
        data: {
          meal: dto.meal?.trim(),
          protein: dto.protein,
          carbs: dto.carbs,
          fat: dto.fat,
          calories: dto.calories,
        },
      });
    } catch (error) {
      this.handleKnownError(error, dto.meal);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.db.meal.delete({
      where: { id },
    });

    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const meal = await this.db.meal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!meal) {
      throw new NotFoundException(`Meal with id ${id} was not found`);
    }
  }

  private handleKnownError(error: unknown, meal?: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        `Meal "${meal ?? 'value'}" already exists in the database`,
      );
    }

    throw error;
  }
}
