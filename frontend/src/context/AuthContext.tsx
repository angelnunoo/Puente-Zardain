'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (token: string, refreshToken: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('token');
    const storedRefresh = window.localStorage.getItem('refreshToken');
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedRefresh) {
      setRefreshToken(storedRefresh);
    }
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      loading,
      signIn(tokenValue: string, refreshTokenValue: string) {
        window.localStorage.setItem('token', tokenValue);
        window.localStorage.setItem('refreshToken', refreshTokenValue);
        setToken(tokenValue);
        setRefreshToken(refreshTokenValue);
      },
      signOut() {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('refreshToken');
        setToken(null);
        setRefreshToken(null);
      },
    }),
    [token, refreshToken, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
