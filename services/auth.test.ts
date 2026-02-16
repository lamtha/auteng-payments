/**
 * Tests for services/auth.ts — requirements-driven.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';

import { setAccessToken } from '@/services/api';
import {
  signInWithApple,
  refreshAccessToken,
  restoreSession,
  clearTokens,
  storeTokens,
} from '@/services/auth';

// Mock the api module
jest.mock('@/services/api', () => ({
  api: jest.fn(),
  setAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
  setAuthHandlers: jest.fn(),
}));

const mockApi = jest.requireMock('@/services/api').api as jest.Mock;
const mockSetAccessToken = setAccessToken as jest.Mock;
const mockSignInAsync = AppleAuthentication.signInAsync as jest.Mock;
const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

const FAKE_AUTH_RESPONSE = {
  auth_token: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.fake',
  refresh_token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.fake',
  user: { id: 1, name: 'Test', username: 'test', email: 'test@example.com' },
  source: 'mobile',
  is_new_user: false,
};

const FAKE_REFRESH_RESPONSE = {
  auth_token: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyfQ.new',
  refresh_token: 'new-refresh-token',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ===================================================================
// signInWithApple
// ===================================================================

describe('signInWithApple', () => {
  test('calls API with id_token from Apple credential', async () => {
    mockSignInAsync.mockResolvedValue({
      identityToken: 'apple-id-token-123',
      fullName: null,
    });
    mockApi.mockResolvedValue(FAKE_AUTH_RESPONSE);

    await signInWithApple();

    expect(mockApi).toHaveBeenCalledWith('/api/auth/mobile/', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ provider: 'apple', id_token: 'apple-id-token-123' }),
      skipAuth: true,
    }));
  });

  test('stores tokens in SecureStore after sign-in', async () => {
    mockSignInAsync.mockResolvedValue({
      identityToken: 'token',
      fullName: null,
    });
    mockApi.mockResolvedValue(FAKE_AUTH_RESPONSE);

    await signInWithApple();

    expect(mockSetItem).toHaveBeenCalledWith('refresh_token', FAKE_AUTH_RESPONSE.refresh_token);
  });

  test('sets access token in memory after sign-in', async () => {
    mockSignInAsync.mockResolvedValue({
      identityToken: 'token',
      fullName: null,
    });
    mockApi.mockResolvedValue(FAKE_AUTH_RESPONSE);

    await signInWithApple();

    expect(mockSetAccessToken).toHaveBeenCalledWith(FAKE_AUTH_RESPONSE.auth_token);
  });

  test('returns user from API response', async () => {
    mockSignInAsync.mockResolvedValue({
      identityToken: 'token',
      fullName: null,
    });
    mockApi.mockResolvedValue(FAKE_AUTH_RESPONSE);

    const user = await signInWithApple();

    expect(user).toEqual(FAKE_AUTH_RESPONSE.user);
  });

  test('throws on API error', async () => {
    mockSignInAsync.mockResolvedValue({
      identityToken: 'token',
      fullName: null,
    });
    mockApi.mockRejectedValue(new Error('400: Bad Request'));

    await expect(signInWithApple()).rejects.toThrow('400: Bad Request');
  });

  test('returns null on user cancellation', async () => {
    const cancelError = new Error('User cancelled');
    (cancelError as any).code = 'ERR_REQUEST_CANCELED';
    mockSignInAsync.mockRejectedValue(cancelError);

    const result = await signInWithApple();

    expect(result).toBeNull();
    expect(mockApi).not.toHaveBeenCalled();
  });
});

// ===================================================================
// refreshAccessToken
// ===================================================================

describe('refreshAccessToken', () => {
  test('sends stored refresh token to API', async () => {
    mockGetItem.mockResolvedValue('stored-refresh-token');
    mockApi.mockResolvedValue(FAKE_REFRESH_RESPONSE);

    await refreshAccessToken();

    expect(mockApi).toHaveBeenCalledWith('/api/auth/token/refresh/', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ refresh_token: 'stored-refresh-token' }),
      skipAuth: true,
    }));
  });

  test('updates stored tokens on success', async () => {
    mockGetItem.mockResolvedValue('old-refresh');
    mockApi.mockResolvedValue(FAKE_REFRESH_RESPONSE);

    await refreshAccessToken();

    expect(mockSetAccessToken).toHaveBeenCalledWith(FAKE_REFRESH_RESPONSE.auth_token);
    expect(mockSetItem).toHaveBeenCalledWith('refresh_token', FAKE_REFRESH_RESPONSE.refresh_token);
  });

  test('clears tokens on failure', async () => {
    mockGetItem.mockResolvedValue('old-refresh');
    mockApi.mockRejectedValue(new Error('400: Invalid token'));

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(mockSetAccessToken).toHaveBeenCalledWith(null);
    expect(mockDeleteItem).toHaveBeenCalledWith('refresh_token');
  });
});

// ===================================================================
// restoreSession
// ===================================================================

describe('restoreSession', () => {
  test('reads refresh token from SecureStore', async () => {
    mockGetItem.mockResolvedValue(null);

    await restoreSession();

    expect(mockGetItem).toHaveBeenCalledWith('refresh_token');
  });

  test('returns null when no stored token', async () => {
    mockGetItem.mockResolvedValue(null);

    const result = await restoreSession();

    expect(result).toBeNull();
    expect(mockApi).not.toHaveBeenCalled();
  });

  test('refreshes and returns user when token exists', async () => {
    mockGetItem.mockResolvedValue('stored-refresh');
    mockApi.mockResolvedValue(FAKE_REFRESH_RESPONSE);

    const result = await restoreSession();

    expect(result).not.toBeNull();
    expect(mockApi).toHaveBeenCalled();
  });
});

// ===================================================================
// clearTokens
// ===================================================================

describe('clearTokens', () => {
  test('removes from SecureStore and clears memory', async () => {
    await clearTokens();

    expect(mockSetAccessToken).toHaveBeenCalledWith(null);
    expect(mockDeleteItem).toHaveBeenCalledWith('refresh_token');
  });
});
