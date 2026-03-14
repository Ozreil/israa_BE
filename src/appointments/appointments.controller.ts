import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  createAppointment(
    @Body(ValidationPipe) body: CreateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.createAppointment(body, user);
  }

  @Get()
  getAppointments(
    @Query(ValidationPipe) query: GetAppointmentsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.getAppointments(query, user);
  }
}
