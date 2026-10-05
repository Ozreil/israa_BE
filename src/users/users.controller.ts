import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { Roles, STAFF_ROLES } from '../auth/roles.decorator';
import { GetUsersDto } from './dto/get-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(...STAFF_ROLES)
  getUsers(@Query() query: GetUsersDto) {
    return this.usersService.getUsers(query.role);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.userId);
  }

  @Get(':id')
  @Roles(...STAFF_ROLES)
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserById(id);
  }
}
