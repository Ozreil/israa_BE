import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AppointmentsModule } from './appointments/appointments.module';
import { MealsModule } from './meals/meals.module';
import { PatientsModule } from './patients/patients.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 600 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AppointmentsModule,
    MealsModule,
    PatientsModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: rate limit first, then authenticate, then check roles.
    // Every route requires a valid token unless marked with @Public().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
