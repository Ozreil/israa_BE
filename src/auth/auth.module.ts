import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthGuard, RolesGuard],
  exports: [AuthService, TokenService, AuthGuard, RolesGuard],
})
export class AuthModule {}
