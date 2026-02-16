/**
 * Auth service — Apple Sign-In, token storage, session restore.
 *
 * Refresh token is persisted in SecureStore (encrypted, survives app restarts).
 * Access token lives in-memory only (set via api.ts's setAccessToken).
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';

import { api, setAccessToken, setAuthHandlers } from '@/services/api';
import type { AuthResponse, AuthUser, RefreshResponse } from '@/types/auth';

const REFRESH_TOKEN_KEY = 'refresh_token';

// Register 401 retry handlers with the API client (breaks circular dep)
setAuthHandlers(
  async () => {
    const user = await refreshAccessToken();
    return user !== null;
  },
  async () => {
    await clearTokens();
  },
);

/** Store tokens: refresh → SecureStore, access → in-memory. */
export async function storeTokens(authToken: string, refreshToken: string): Promise<void> {
  setAccessToken(authToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

/** Clear all stored tokens. */
export async function clearTokens(): Promise<void> {
  setAccessToken(null);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * Trigger native Apple Sign-In and exchange the id_token with the backend.
 *
 * Returns the authenticated user, or null if the user cancelled.
 * Throws on API or unexpected errors.
 */
export async function signInWithApple(): Promise<AuthUser | null> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error: unknown) {
    // User cancelled the dialog — not an error
    if (error instanceof Error && 'code' in error && (error as any).code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In returned no identity token');
  }

  // Build full_name from Apple's name components (only sent on first sign-in)
  let fullName: string | undefined;
  if (credential.fullName?.givenName) {
    fullName = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
  }

  const data = await api<AuthResponse>('/api/auth/mobile/', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'apple',
      id_token: credential.identityToken,
      ...(fullName ? { full_name: fullName } : {}),
    }),
    skipAuth: true,
  });

  await storeTokens(data.auth_token, data.refresh_token);
  return data.user;
}

/**
 * Refresh the access token using the stored refresh token.
 *
 * Returns the new auth user info on success, or null if refresh failed
 * (expired token, etc.) — in which case tokens are cleared.
 */
export async function refreshAccessToken(): Promise<AuthUser | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  try {
    const data = await api<RefreshResponse>('/api/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipAuth: true,
    });

    await storeTokens(data.auth_token, data.refresh_token);

    // Decode user info from the new access token (JWT payload)
    const payload = JSON.parse(atob(data.auth_token.split('.')[1]));
    return {
      id: payload.user_id,
      name: '',
      username: '',
      email: '',
    } as AuthUser;
  } catch {
    await clearTokens();
    return null;
  }
}

/**
 * Restore session on app launch.
 *
 * Reads refresh token from SecureStore and attempts a refresh.
 * Returns the user if session restored, null otherwise.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }
  return refreshAccessToken();
}
