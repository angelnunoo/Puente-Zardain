const DEFAULT_ORIGIN = 'http://localhost:3001';
const VERSIONED_PREFIX = /\/api\/v\d+$/;

function configuredOrigin(configured?: string): string {
  const raw = (configured ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_ORIGIN).trim();
  return raw.replace(/\/+$/, '');
}

/** Socket.io and other non-prefixed listeners stay on the host origin. */
export function resolveApiOrigin(configured?: string): string {
  return configuredOrigin(configured).replace(VERSIONED_PREFIX, '');
}

/**
 * Nest sets a global prefix of `/api/v1` (see ConfigService.apiPrefix).
 * HTTP clients must include it. An env value that already ends in `/api/vN` is kept.
 */
export function resolveHttpApiBase(configured?: string): string {
  const raw = configuredOrigin(configured);
  if (VERSIONED_PREFIX.test(raw)) {
    return raw;
  }
  return `${raw}/api/v1`;
}
