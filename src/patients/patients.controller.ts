import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  createPatient(@Body() dto: CreatePatientDto) {
    return this.patientsService.createPatient(dto);
  }

  @Get(':id')
  getPatientById(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getPatientById(id);
  }
}
