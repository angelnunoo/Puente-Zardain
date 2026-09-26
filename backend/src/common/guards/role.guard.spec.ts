import { readFileSync } from 'fs';
import { join } from 'path';
import { ForbiddenException } from '@nestjs/common';
import { RoleGuard } from './role.guard';

/**
 * Nest runs global APP_GUARD instances before route guards. RoleGuard denies
 * the request when role metadata is present and request.user is missing, so it
 * must not be registered globally ahead of JwtAuthGuard.
 */
describe('RoleGuard', () => {
  const contextFor = (user?: { role: string }) =>
    ({
      getHandler: () => function handler() {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  const guardWithRoles = (roles: string[]) => new RoleGuard({ get: () => roles } as any);

  it('rejects a role-protected handler when authentication has not set request.user', () => {
    const guard = guardWithRoles(['ADMIN']);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow('Usuario no autenticado');
  });

  it('allows an admin once the authenticated user is on the request', () => {
    const guard = guardWithRoles(['ADMIN']);

    expect(guard.canActivate(contextFor({ role: 'ADMIN' }))).toBe(true);
  });

  it('is not registered as a global guard ahead of JWT auth', () => {
    const source = readFileSync(join(__dirname, '../common.module.ts'), 'utf8');

    expect(source.includes('APP_GUARD')).toBe(false);
    expect(source.includes('useClass: RoleGuard')).toBe(false);
  });
});
