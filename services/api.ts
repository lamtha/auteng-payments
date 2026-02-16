import { Config } from '@/services/config';

interface RequestOptions extends RequestInit {
  /** Skip auth header injection (e.g. for the login endpoint). */
  skipAuth?: boolean;
  /** Internal flag to prevent infinite retry loops. */
  _isRetry?: boolean;
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

// -----------------------------------------------------------------------
// 401 refresh callback — registered by auth service to break circular dep
// -----------------------------------------------------------------------
type RefreshHandler = () => Promise<boolean>;
type ClearHandler = () => Promise<void>;

let _onRefresh: RefreshHandler | null = null;
let _onClearTokens: ClearHandler | null = null;

/**
 * Register handlers for 401 retry logic.
 * Called by auth service during initialization.
 */
export function setAuthHandlers(onRefresh: RefreshHandler, onClear: ClearHandler) {
  _onRefresh = onRefresh;
  _onClearTokens = onClear;
}

/**
 * Thin fetch wrapper with base URL, auth header injection,
 * and automatic 401 retry via token refresh.
 *
 * On a 401 response (and skipAuth is false):
 *   1. Attempt to refresh the access token via registered handler
 *   2. If refresh succeeds, retry the original request once
 *   3. If refresh fails, clear tokens and throw
 */
export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, _isRetry, headers: customHeaders, ...fetchOptions } = options;

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

  // Handle 401 with automatic token refresh (one retry only)
  if (response.status === 401 && !skipAuth && !_isRetry && _onRefresh) {
    const refreshed = await _onRefresh();
    if (refreshed) {
      return api<T>(path, { ...options, _isRetry: true });
    }
    // Refresh failed — clear tokens and throw
    if (_onClearTokens) {
      await _onClearTokens();
    }
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
