import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const TOKEN_KEY = 'ecobite_token';
const USER_KEY = 'ecobite_user';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
    setToken(nextToken || null);
    setUserState(nextUser || null);
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    api('/auth/me', { token })
      .then(({ user: freshUser }) => {
        if (!active) return;
        setUserState(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = useCallback(
    async (email, password) => {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const data = await api('/auth/register', { method: 'POST', body: payload });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const refreshUser = useCallback(async () => {
    const data = await api('/users/me');
    setUserState(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [token, user, loading, login, register, logout, refreshUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
