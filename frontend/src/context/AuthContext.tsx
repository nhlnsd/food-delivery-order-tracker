'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthState } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    authApi
      .me()
      .then((res) => {
        setState({ user: res.data.user, token, isLoading: false });
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data;
    localStorage.setItem('auth_token', token);
    setState({ user, token, isLoading: false });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    const res = await authApi.register(name, email, password, role);
    const { token, user } = res.data;
    localStorage.setItem('auth_token', token);
    setState({ user, token, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setState({ user: null, token: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
