import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { hasRequiredRole } from './role-access.ts';

test('routes with no role metadata stay available', () => {
  assert.equal(hasRequiredRole(undefined, undefined), true);
  assert.equal(hasRequiredRole(null, 'USER'), true);
  assert.equal(hasRequiredRole([], 'USER'), true);
});

test('admin-only metadata rejects a customer and an anonymous caller', () => {
  assert.equal(hasRequiredRole(['ADMIN'], 'USER'), false);
  assert.equal(hasRequiredRole(['ADMIN'], undefined), false);
  assert.equal(hasRequiredRole(['ADMIN'], null), false);
});

test('admin-only metadata allows an admin', () => {
  assert.equal(hasRequiredRole(['ADMIN'], 'ADMIN'), true);
});

test('RolesGuard applies controller-class @Roles, not only method metadata', () => {
  const source = fs.readFileSync(new URL('./roles.guard.ts', import.meta.url), 'utf8');
  assert.match(source, /getAllAndOverride/);
  assert.match(source, /getClass\(\)/);
  assert.doesNotMatch(source, /reflector\.get</);
});

test('analytics sales queries do not load password hashes', () => {
  const source = fs.readFileSync(
    new URL('../../analytics/analytics.service.ts', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /user:\s*true/);
  assert.doesNotMatch(source, /password/);
});
