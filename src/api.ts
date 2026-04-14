import { API_BASE_URL, SITE_BASE_URL } from './config';
import type { RecipeDetail, RecipeListItem } from './types';

import offlineRecipes from './offlineRecipes.json';

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

const unwrap = async <T>(res: Response): Promise<T> => {
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json || (json as any).ok === false) {
    const msg = (json as any)?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (json as any).data as T;
};

const postJson = async <T>(path: string, body: any): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
};

const toAbsoluteUrl = (url: string): string => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${SITE_BASE_URL}${raw}`;
  return `${SITE_BASE_URL}/${raw}`;
};

const normalizeRecipeImage = (args: { id: string; image: any }): string => {
  const id = String(args.id || '').trim();
  const raw = String(args.image || '').trim();

  if (!raw) return `${SITE_BASE_URL}/recipes/${id}.jpg`;
  if (raw.includes('source.unsplash.com')) return `${SITE_BASE_URL}/recipes/${id}.jpg`;
  return toAbsoluteUrl(raw);
};

export const fetchMobileConfig = async (): Promise<{ logo_url: string }> => {
  const res = await fetch(`${API_BASE_URL}/mobile/config`);
  const data = await unwrap<any>(res);
  return {
    logo_url: String((data as any)?.logo_url ?? ''),
  };
};

export const fetchRecipes = async (): Promise<RecipeListItem[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/recipes`);
    const rows = await unwrap<any[]>(res);
    return rows.map((r) => ({
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      image: normalizeRecipeImage({ id: String(r.id ?? ''), image: (r as any).image }),
      price: Number(r.price ?? 0),
      time: String(r.time ?? ''),
      calories: String(r.calories ?? ''),
      category: String(r.category ?? ''),
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    }));
  } catch {
    const rows = Array.isArray(offlineRecipes) ? (offlineRecipes as any[]) : [];
    return rows.map((r) => ({
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      image: normalizeRecipeImage({ id: String(r.id ?? ''), image: (r as any).image }),
      price: Number(r.price ?? 0),
      time: String(r.time ?? ''),
      calories: String(r.calories ?? ''),
      category: String(r.category ?? ''),
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    }));
  }
};

export const fetchRecipeDetail = async (id: string): Promise<RecipeDetail> => {
  try {
    const res = await fetch(`${API_BASE_URL}/mobile/recipes/${encodeURIComponent(id)}`);
    const r = await unwrap<any>(res);
    return {
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      image: normalizeRecipeImage({ id: String(r.id ?? ''), image: (r as any).image }),
      price: Number(r.price ?? 0),
      time: String(r.time ?? ''),
      calories: String(r.calories ?? ''),
      category: String(r.category ?? ''),
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
      ingredients: Array.isArray(r.ingredients)
        ? r.ingredients.map((i: any) => ({
            id: String(i.id ?? ''),
            name: String(i.name ?? ''),
            unit: String(i.unit ?? ''),
            quantity: Number(i.quantity ?? 0),
            price_per_unit:
              i.price_per_unit === undefined || i.price_per_unit === null ? undefined : Number(i.price_per_unit),
          }))
        : [],
      preparation_steps: Array.isArray(r.preparation_steps)
        ? r.preparation_steps.map((s: any) => ({
            id: String(s.id ?? ''),
            recipe_id: String(s.recipe_id ?? ''),
            step_number: Number(s.step_number ?? 0),
            description: String(s.description ?? ''),
          }))
        : [],
    };
  } catch {
    const rows = Array.isArray(offlineRecipes) ? (offlineRecipes as any[]) : [];
    const found = rows.find((r) => String((r as any)?.id ?? '') === String(id));
    const r: any = found ?? { id };

    return {
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      image: normalizeRecipeImage({ id: String(r.id ?? ''), image: (r as any).image }),
      price: Number(r.price ?? 0),
      time: String(r.time ?? ''),
      calories: String(r.calories ?? ''),
      category: String(r.category ?? ''),
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
      ingredients: Array.isArray(r.ingredients)
        ? r.ingredients.map((i: any) => ({
            id: String(i.id ?? ''),
            name: String(i.name ?? ''),
            unit: String(i.unit ?? ''),
            quantity: Number(i.quantity ?? 0),
            price_per_unit:
              i.price_per_unit === undefined || i.price_per_unit === null ? undefined : Number(i.price_per_unit),
          }))
        : [],
      preparation_steps: Array.isArray(r.preparation_steps)
        ? r.preparation_steps.map((s: any) => ({
            id: String(s.id ?? ''),
            recipe_id: String(s.recipe_id ?? ''),
            step_number: Number(s.step_number ?? 0),
            description: String(s.description ?? ''),
          }))
        : [],
    };
  }
};

export const upsertUser = async (args: { email: string; name?: string; phone?: string }): Promise<any> => {
  return postJson<any>('/users/upsert', {
    email: args.email,
    name: args.name ?? '',
    phone: args.phone ?? '',
  });
};

export const fetchUserByEmail = async (email: string): Promise<any | null> => {
  const res = await fetch(`${API_BASE_URL}/users/by-email?email=${encodeURIComponent(email)}`);
  return unwrap<any | null>(res);
};

export const fetchCart = async (email: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/cart?email=${encodeURIComponent(email)}`);
  return unwrap<any[]>(res);
};

export const saveCart = async (email: string, items: any[]): Promise<boolean> => {
  return postJson<boolean>('/cart/save', {
    email,
    items,
  });
};

export const fetchOrdersByUserEmail = async (email: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/orders/by-user?email=${encodeURIComponent(email)}`);
  return unwrap<any[]>(res);
};

export const createOrder = async (args: {
  email: string;
  address: string;
  total: number;
  items: any[];
  customer?: { name?: string; phone?: string };
}): Promise<any> => {
  return postJson<any>('/orders/create', {
    email: args.email,
    address: args.address,
    total: args.total,
    items: args.items,
    customer: args.customer ?? {},
  });
};
