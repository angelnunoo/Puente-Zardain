import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../../shared/enums';
import { ROLES_KEY } from './roles.decorator';
import { hasRequiredRole } from './role-access';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Handler metadata wins, but class-level @Roles must still apply.
    // reflector.get(handler) alone ignores @Roles() declared on the controller.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    return hasRequiredRole(requiredRoles, request.user?.role);
  }
}
