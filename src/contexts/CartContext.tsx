import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchCart, saveCart } from '../api';
import { useAuth } from './AuthContext';

export type CartItem = {
  recipeId: string;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  loading: boolean;
  addRecipe: (args: { recipeId: string; title: string; image: string; unitPrice: number }) => void;
  removeRecipe: (recipeId: string) => void;
  clear: () => void;
  total: number;
  sync: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0), [items]);

  const persistLocal = useCallback(async (next: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const sync = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const remote = await fetchCart(user.email);
      if (Array.isArray(remote)) {
        const normalized = remote
          .map((r: any) => ({
            recipeId: String(r.recipeId ?? r.recipe_id ?? ''),
            title: String(r.title ?? ''),
            image: String(r.image ?? ''),
            unitPrice: Number(r.unitPrice ?? r.unit_price ?? 0),
            quantity: Number(r.quantity ?? 1),
          }))
          .filter((x) => x.recipeId);
        setItems((prev) => {
          if (normalized.length === 0 && prev.length > 0) return prev;
          void persistLocal(normalized);
          return normalized;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email, persistLocal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {
        // ignore
      }

      await sync();
    })();

    return () => {
      cancelled = true;
    };
  }, [sync]);

  const persist = useCallback(
    async (next: CartItem[]) => {
      await persistLocal(next);
      if (!user?.email) return;
      try {
        await saveCart(user.email, next);
      } catch {
        // ignore
      }
    },
    [persistLocal, user?.email]
  );

  const addRecipe = useCallback(
    (args: { recipeId: string; title: string; image: string; unitPrice: number }) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.recipeId === args.recipeId);
        let next: CartItem[];
        if (idx >= 0) {
          next = prev.map((p, i) => (i === idx ? { ...p, quantity: p.quantity + 1 } : p));
        } else {
          next = [...prev, { recipeId: args.recipeId, title: args.title, image: args.image, unitPrice: args.unitPrice, quantity: 1 }];
        }
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeRecipe = useCallback(
    (recipeId: string) => {
      setItems((prev) => {
        const next = prev.filter((p) => p.recipeId !== recipeId);
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  const clear = useCallback(() => {
    setItems([]);
    void persist([]);
  }, [persist]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      loading,
      addRecipe,
      removeRecipe,
      clear,
      total,
      sync,
    }),
    [items, loading, addRecipe, removeRecipe, clear, total, sync]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
