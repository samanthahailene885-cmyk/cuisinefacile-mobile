import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchUserByEmail, upsertUser } from '../api';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  lastLoginAction: 'existing' | 'created' | null;
  loginExisting: (args: { email: string }) => Promise<void>;
  createAccount: (args: { email: string; name?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'cuisinefacile.auth.user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastLoginAction, setLastLoginAction] = useState<'existing' | 'created' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AuthUser;
          if (parsed?.email) setUser(parsed);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginExisting = useCallback(async (args: { email: string }) => {
    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error('Email requis');

    setLastLoginAction(null);

    const existing = await fetchUserByEmail(email);
    if (!existing) throw new Error('Compte introuvable. Créez un compte.');

    const u = await upsertUser({ email, name: String((existing as any)?.name ?? ''), phone: String((existing as any)?.phone ?? '') });
    const out: AuthUser = {
      id: String((u as any).id ?? (existing as any)?.id ?? ''),
      email: String((u as any).email ?? email),
      name: String((u as any).name ?? (existing as any)?.name ?? ''),
      phone: String((u as any).phone ?? (existing as any)?.phone ?? ''),
    };

    setLastLoginAction('existing');
    setUser(out);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  }, []);

  const createAccount = useCallback(async (args: { email: string; name?: string; phone?: string }) => {
    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error('Email requis');

    setLastLoginAction(null);

    const existing = await fetchUserByEmail(email);
    if (existing) throw new Error('Compte déjà existant. Connectez-vous.');

    const u = await upsertUser({ email, name: args.name ?? '', phone: args.phone ?? '' });
    const out: AuthUser = {
      id: String((u as any).id ?? ''),
      email: String((u as any).email ?? email),
      name: String((u as any).name ?? args.name ?? ''),
      phone: String((u as any).phone ?? args.phone ?? ''),
    };

    setLastLoginAction('created');
    setUser(out);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setLastLoginAction(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      lastLoginAction,
      loginExisting,
      createAccount,
      logout,
    }),
    [user, loading, lastLoginAction, loginExisting, createAccount, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
