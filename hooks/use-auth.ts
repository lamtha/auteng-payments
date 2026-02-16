/**
 * Auth state hook — provides isAuthenticated, user, signIn, signOut.
 *
 * Restores session from SecureStore on mount.
 * Intended to be used inside AuthProvider (see contexts/auth-context.tsx).
 */
import { useCallback, useEffect, useState } from 'react';

import {
  signInWithApple,
  restoreSession,
  clearTokens,
} from '@/services/auth';
import type { AuthUser } from '@/types/auth';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let mounted = true;

    async function restore() {
      try {
        const restored = await restoreSession();
        if (mounted) {
          setUser(restored);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restore();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    const authedUser = await signInWithApple();
    if (authedUser) {
      setUser(authedUser);
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return {
    isAuthenticated: user !== null,
    isLoading,
    user,
    signIn,
    signOut,
  };
}
