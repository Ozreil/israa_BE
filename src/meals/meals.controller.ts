import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { AutocompleteMealsDto } from './dto/autocomplete-meals.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { GetMealsDto } from './dto/get-meals.dto';

@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  create(@Body() dto: CreateMealDto) {
    return this.mealsService.create(dto);
  }

  @Get()
  findAll(@Query() query: GetMealsDto) {
    return this.mealsService.findAll(query);
  }

  @Get('autocomplete')
  autocomplete(@Query() query: AutocompleteMealsDto) {
    return this.mealsService.autocomplete(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMealDto,
  ) {
    return this.mealsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealsService.remove(id);
  }
}
