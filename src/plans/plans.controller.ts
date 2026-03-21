import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { GetPlanByIdDto } from './dto/get-plan-by-id.dto';
import { GetPlansDto } from './dto/get-plans.dto';
import {
  AddMealToPlanDto,
  RemoveMealFromPlanDto,
  ReplaceMealInPlanDto,
} from './dto/modify-plan-meal.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Header('Content-Type', 'application/json')
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Get()
  @Header('Content-Type', 'application/json')
  findAll(@Query() query: GetPlansDto) {
    return this.plansService.findAll(query);
  }

  @Get(':id')
  @Header('Content-Type', 'application/json')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Query() query: GetPlanByIdDto) {
    return this.plansService.findOne(id, query.expandMeals);
  }

  @Patch(':id')
  @Header('Content-Type', 'application/json')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Patch(':id/meals/add')
  @Header('Content-Type', 'application/json')
  addMeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMealToPlanDto,
  ) {
    return this.plansService.addMeal(id, dto);
  }

  @Patch(':id/meals/remove')
  @Header('Content-Type', 'application/json')
  removeMeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveMealFromPlanDto,
  ) {
    return this.plansService.removeMeal(id, dto);
  }

  @Patch(':id/meals/replace')
  @Header('Content-Type', 'application/json')
  replaceMeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceMealInPlanDto,
  ) {
    return this.plansService.replaceMeal(id, dto);
  }

  @Delete(':id')
  @Header('Content-Type', 'application/json')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.remove(id);
  }
}
