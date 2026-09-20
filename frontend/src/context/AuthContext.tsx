'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../lib/api';
import { isJwtExpired, nextSessionTokens } from '../lib/auth-token';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  user: any | null;
  isTokenExpired: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (token: string, refreshToken: string, user?: any) => void;
  signOut: () => void;
  refreshAccessToken: () => Promise<boolean>;
  isTokenValid: () => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const tokenExpired = useMemo(() => {
    if (!token) return true;
    return isJwtExpired(token);
  }, [token]);

  const persistSession = useCallback((accessToken: string, nextRefresh: string, userData?: any) => {
    window.localStorage.setItem('token', accessToken);
    window.localStorage.setItem('refreshToken', nextRefresh);
    if (userData) {
      window.localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    setToken(accessToken);
    setRefreshToken(nextRefresh);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (currentRefreshToken: string): Promise<boolean> => {
    try {
      const newTokens = await authApi.refresh(currentRefreshToken);
      const next = nextSessionTokens(newTokens, currentRefreshToken);
      if (!next) {
        return false;
      }
      persistSession(next.accessToken, next.refreshToken);
      return true;
    } catch {
      return false;
    }
  }, [persistSession]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('token');
    const storedRefresh = window.localStorage.getItem('refreshToken');
    const storedUser = window.localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedRefresh) {
      setRefreshToken(storedRefresh);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        window.localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token || !refreshToken || loading) return;

    const checkExpiration = () => {
      if (!isJwtExpired(token)) {
        return;
      }

      refreshSession(refreshToken).then((ok) => {
        if (!ok) {
          signOut();
        }
      });
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [token, refreshToken, loading, refreshSession, signOut]);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      loading,
      user,
      isTokenExpired: tokenExpired,
      signIn(tokenValue: string, refreshTokenValue: string, userData?: any) {
        persistSession(tokenValue, refreshTokenValue, userData);
      },
      signOut,
      refreshAccessToken: async (): Promise<boolean> => {
        if (!refreshToken) return false;
        const ok = await refreshSession(refreshToken);
        if (!ok) {
          signOut();
        }
        return ok;
      },
      isTokenValid: (): boolean => Boolean(token) && !tokenExpired,
    }),
    [token, refreshToken, loading, user, tokenExpired, persistSession, signOut, refreshSession],
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
