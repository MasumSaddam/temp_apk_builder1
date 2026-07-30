import * as React from 'react';
import type { AuthUser } from '@/types';
import { getStoredUser, login as apiLogin, logout as apiLogout } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getStoredUser()
      .then((stored: AuthUser | null) => {
        if (!cancelled) setUser(stored);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    if ('error' in result) {
      return { error: result.error };
    }
    setUser(result.user);
    return {};
  }, []);

  const logout = React.useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
