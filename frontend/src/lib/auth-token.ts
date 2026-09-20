/**
 * JWT helpers for client-side session handling.
 * Passport/jsonwebtoken payloads are base64url, so atob() cannot be used raw.
 */

export type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  refreshToken?: string;
};

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const segment = token.split('.')[1];
  if (!segment) {
    throw new Error('Token JWT inválido');
  }

  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
}

export function isJwtExpired(token: string, nowSeconds: number = Date.now() / 1000): boolean {
  try {
    const payload = decodeJwtPayload(token);
    return typeof payload.exp !== 'number' || payload.exp < nowSeconds;
  } catch {
    return true;
  }
}

export function refreshTokenRequestBody(refreshToken: string) {
  return { refreshToken };
}

export function nextSessionTokens(response: RefreshResponse, currentRefreshToken: string) {
  const accessToken = response.access_token;
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: response.refresh_token || response.refreshToken || currentRefreshToken,
  };
}
