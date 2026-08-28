'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import {
  useMeQuery,
  useLoginMutation,
  useLogoutMutation
} from './__generated__/queries.generated';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, loading, refetch, client } = useMeQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });
  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const user: AuthUser | null = data?.me ?? null;

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const { data: loginData } = await loginMutation({
        variables: { email, password }
      });
      const result = loginData?.login;
      if (!result) {
        return { success: false, error: 'Unable to sign in.' };
      }
      if (result.__typename === 'AuthError') {
        return { success: false, error: result.message };
      }
      await refetch();
      return { success: true };
    },
    [loginMutation, refetch]
  );

  const logout = useCallback(async () => {
    await logoutMutation();
    await client.clearStore();
  }, [logoutMutation, client]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: Boolean(user), login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
