import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const STAFF_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

/** Restricts a route or controller to users with one of the given roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
