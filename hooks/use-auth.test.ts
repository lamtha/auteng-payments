/**
 * Tests for hooks/use-auth.ts — requirements-driven.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useAuth } from '@/hooks/use-auth';

// Mock the auth service
jest.mock('@/services/auth', () => ({
  signInWithApple: jest.fn(),
  restoreSession: jest.fn(),
  clearTokens: jest.fn(),
}));

const { signInWithApple, restoreSession, clearTokens } =
  jest.requireMock('@/services/auth') as {
    signInWithApple: jest.Mock;
    restoreSession: jest.Mock;
    clearTokens: jest.Mock;
  };

const FAKE_USER = { id: 1, name: 'Test', username: 'test', email: 'test@example.com' };

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no stored session
  restoreSession.mockResolvedValue(null);
  clearTokens.mockResolvedValue(undefined);
});

describe('useAuth', () => {
  test('initial state is loading', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('calls restoreSession on mount', async () => {
    renderHook(() => useAuth());

    await waitFor(() => {
      expect(restoreSession).toHaveBeenCalledTimes(1);
    });
  });

  test('sets authenticated after successful restore', async () => {
    restoreSession.mockResolvedValue(FAKE_USER);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(FAKE_USER);
  });

  test('sets unauthenticated when no session', async () => {
    restoreSession.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test('signIn updates state on success', async () => {
    signInWithApple.mockResolvedValue(FAKE_USER);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(FAKE_USER);
  });

  test('signOut clears state', async () => {
    // Start authenticated
    restoreSession.mockResolvedValue(FAKE_USER);
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(clearTokens).toHaveBeenCalled();
  });
});
