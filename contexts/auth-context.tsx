/**
 * Auth context — provides auth state to the entire app tree.
 *
 * Wrap the root layout with <AuthProvider> to make auth state
 * available via useAuthContext() in any component.
 */
import { createContext, useContext } from 'react';

import { useAuth, type AuthState } from '@/hooks/use-auth';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Access auth state from any component inside AuthProvider.
 * Throws if used outside the provider.
 */
export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
