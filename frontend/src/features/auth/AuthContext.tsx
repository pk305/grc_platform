'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import {
  useMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useVerifyMfaCodeMutation
} from './__generated__/queries.generated';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperuser: boolean;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  roles: { id: string; name: string }[];
}

interface LoginResult {
  success: boolean;
  error?: string;
  mfaRequired?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperuser: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyMfaCode: (code: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, loading, refetch, client } = useMeQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });
  const [loginMutation] = useLoginMutation();
  const [verifyMfaCodeMutation] = useVerifyMfaCodeMutation();
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
      if (result.__typename === 'MfaRequired') {
        return { success: false, mfaRequired: true };
      }
      await refetch();
      return { success: true };
    },
    [loginMutation, refetch]
  );

  const verifyMfaCode = useCallback(
    async (code: string): Promise<LoginResult> => {
      const { data: verifyData } = await verifyMfaCodeMutation({
        variables: { code }
      });
      const result = verifyData?.verifyMfaCode;
      if (!result) {
        return { success: false, error: 'Unable to verify code.' };
      }
      if (result.__typename === 'AuthError') {
        return { success: false, error: result.message };
      }
      if (result.__typename === 'MfaRequired') {
        return { success: false, mfaRequired: true };
      }
      await refetch();
      return { success: true };
    },
    [verifyMfaCodeMutation, refetch]
  );

  const logout = useCallback(async () => {
    await logoutMutation();
    await client.clearStore();
  }, [logoutMutation, client]);

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const isSuperuser = user?.isSuperuser ?? false;
  const isAdmin =
    isSuperuser || (user?.roles.some(role => role.name === 'admin') ?? false);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin,
        isSuperuser,
        login,
        verifyMfaCode,
        logout,
        refreshUser
      }}
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
