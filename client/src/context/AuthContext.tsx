import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, TOKEN_KEY } from '@/lib/api';
import type { User } from '@/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api.get<{ user: User }>('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('tj:logout', logout);
    return () => window.removeEventListener('tj:logout', logout);
  }, [logout]);

  const finish = (data: { token: string; user: User }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    qc.clear();
    setUser(data.user);
  };

  const value: AuthCtx = {
    user,
    loading,
    logout,
    login: async (email, password) => finish((await api.post('/auth/login', { email, password })).data),
    register: async (name, email, password) => finish((await api.post('/auth/register', { name, email, password })).data),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside provider');
  return c;
};
