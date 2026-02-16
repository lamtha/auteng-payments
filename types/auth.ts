/** Authenticated user returned by the backend. */
export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
}

/** Token pair used for authenticated requests. */
export interface AuthTokens {
  authToken: string;
  refreshToken: string;
}

/** Raw response shape from POST /api/auth/mobile/ and token refresh. */
export interface AuthResponse {
  auth_token: string;
  refresh_token: string;
  user: AuthUser;
  source: string;
  is_new_user: boolean;
}

/** Raw response shape from POST /api/auth/token/refresh/. */
export interface RefreshResponse {
  auth_token: string;
  refresh_token: string;
}
