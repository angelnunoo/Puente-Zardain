'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

// Helper para verificar si el token está expirado
const checkTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Helper para refrescar el token
const refreshAccessToken = async (refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const isTokenExpired = useMemo(() => {
    if (!token) return true;
    return checkTokenExpired(token);
  }, [token]);

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
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Auto-refresh del token antes de que expire
  useEffect(() => {
    if (!token || !refreshToken || loading) return;

    const checkExpiration = () => {
      if (isTokenExpired) {
        refreshAccessToken(refreshToken).then((newTokens) => {
          if (newTokens) {
            setToken(newTokens.access_token);
            setRefreshToken(newTokens.refresh_token);
            window.localStorage.setItem('token', newTokens.access_token);
            window.localStorage.setItem('refreshToken', newTokens.refresh_token);
          } else {
            // Si no se puede refrescar, cerrar sesión
            signOut();
          }
        });
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [token, refreshToken, loading, isTokenExpired]);

  const value = useMemo(
    () =>({
      token,
      refreshToken,
      loading,
      user,
      isTokenExpired,
      signIn(tokenValue: string, refreshTokenValue: string, userData?: any) {
        window.localStorage.setItem('token', tokenValue);
        window.localStorage.setItem('refreshToken', refreshTokenValue);
        if (userData) {
          window.localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        setToken(tokenValue);
        setRefreshToken(refreshTokenValue);
      },
      signOut() {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('refreshToken');
        window.localStorage.removeItem('user');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      },
      refreshAccessToken: async (): Promise<boolean> => {
        if (!refreshToken) return false;
        
        try {
          const newTokens = await refreshAccessToken(refreshToken);
          if (newTokens) {
            setToken(newTokens.access_token);
            setRefreshToken(newTokens.refresh_token);
            window.localStorage.setItem('token', newTokens.access_token);
            window.localStorage.setItem('refreshToken', newTokens.refresh_token);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
      isTokenValid: (): boolean => {
        return token && !isTokenExpired(token);
      },
    }),
    [token, refreshToken, loading, user, isTokenExpired],
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
