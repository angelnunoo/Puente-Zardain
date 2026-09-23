/**
 * Builds a fetch init that keeps JSON content type when callers add headers
 * such as Authorization. Spreading `init` after a headers object replaces
 * those headers entirely, so Express never parses the JSON body.
 */
export function buildFetchInit(init: RequestInit = {}): RequestInit {
  const { headers, ...rest } = init;
  return {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
}
