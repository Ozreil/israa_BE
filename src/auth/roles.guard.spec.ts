import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Public } from './public.decorator';
import { Roles, STAFF_ROLES } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Roles(...STAFF_ROLES)
class StaffController {
  list() {}

  @Public()
  open() {}
}

class MixedController {
  me() {}
}

function contextFor(
  controller: new () => object,
  handler: string,
  role?: UserRole,
): ExecutionContext {
  const request = role ? { user: { userId: 'u1', email: 'e', role } } : {};

  return {
    getHandler: () =>
      (controller.prototype as Record<string, unknown>)[handler],
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('rejects patients on staff-only routes', () => {
    expect(() =>
      guard.canActivate(contextFor(StaffController, 'list', UserRole.PATIENT)),
    ).toThrow(ForbiddenException);
  });

  it('allows admins and super admins on staff-only routes', () => {
    expect(
      guard.canActivate(contextFor(StaffController, 'list', UserRole.ADMIN)),
    ).toBe(true);
    expect(
      guard.canActivate(
        contextFor(StaffController, 'list', UserRole.SUPER_ADMIN),
      ),
    ).toBe(true);
  });

  it('rejects requests with no user on staff-only routes', () => {
    expect(() =>
      guard.canActivate(contextFor(StaffController, 'list')),
    ).toThrow(ForbiddenException);
  });

  it('lets @Public() handlers through regardless of class roles', () => {
    expect(guard.canActivate(contextFor(StaffController, 'open'))).toBe(true);
  });

  it('allows any authenticated user when no roles are required', () => {
    expect(
      guard.canActivate(contextFor(MixedController, 'me', UserRole.PATIENT)),
    ).toBe(true);
  });
});
