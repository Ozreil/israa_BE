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
import { MealsService } from './meals.service';
import { AutocompleteMealsDto } from './dto/autocomplete-meals.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { GetMealsDto } from './dto/get-meals.dto';

@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  @Header('Content-Type', 'application/json')
  create(@Body() dto: CreateMealDto) {
    return this.mealsService.create(dto);
  }

  @Get()
  @Header('Content-Type', 'application/json')
  findAll(@Query() query: GetMealsDto) {
    return this.mealsService.findAll(query);
  }

  @Get('autocomplete')
  @Header('Content-Type', 'application/json')
  autocomplete(@Query() query: AutocompleteMealsDto) {
    return this.mealsService.autocomplete(query);
  }

  @Get(':id')
  @Header('Content-Type', 'application/json')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealsService.findOne(id);
  }

  @Patch(':id')
  @Header('Content-Type', 'application/json')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMealDto,
  ) {
    return this.mealsService.update(id, dto);
  }

  @Delete(':id')
  @Header('Content-Type', 'application/json')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mealsService.remove(id);
  }
}
