import { Config } from '@/services/config';

interface RequestOptions extends RequestInit {
  /** Skip auth header injection (e.g. for the login endpoint). */
  skipAuth?: boolean;
}

let accessToken: string | null = null;

/** Set the access token used for authenticated requests. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Get the current access token (for refresh flows). */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Thin fetch wrapper with base URL and auth header injection.
 * Throws on non-ok responses with the response body as the error message.
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
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
