/**
 * GUARD DE ROLES
 * Valida que el usuario tiene el rol requerido para acceder a un endpoint
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../../shared/enums';

export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar roles requeridos en un endpoint
 */
export const RequireRoles = (...roles: UserRole[]) => {
  return Reflector.createDecorator({ key: ROLES_KEY, transform: () => roles });
};

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

/**
 * Decorador más simple para uso en Controllers
 */
export const AdminOnly = () => RequireRoles(UserRole.ADMIN);
export const UserOnly = () => RequireRoles(UserRole.USER);
