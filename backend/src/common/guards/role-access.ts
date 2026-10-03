/**
 * A route with no role metadata is not role-restricted.
 * An empty list is treated the same way: nothing was required.
 */
export function hasRequiredRole(
  requiredRoles: readonly string[] | undefined | null,
  userRole?: string | null,
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return Boolean(userRole) && requiredRoles.includes(userRole);
}
