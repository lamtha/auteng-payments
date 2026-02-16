import { Config } from '@/services/config';

interface RequestOptions extends RequestInit {
  /** Skip auth header injection (e.g. for unauthenticated endpoints). */
  skipAuth?: boolean;
}

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set the access token (device token) used for authenticated requests. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Get the current access token. */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Register a callback invoked when the server returns 401. */
export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/**
 * Thin fetch wrapper with base URL and auth header injection.
 * Device tokens don't expire, so no refresh/retry logic needed.
 */
export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${Config.apiUrl}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
