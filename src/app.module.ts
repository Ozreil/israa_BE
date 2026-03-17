import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MealsModule } from './meals/meals.module';
import { PatientsModule } from './patients/patients.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    AppointmentsModule,
    MealsModule,
    PatientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
