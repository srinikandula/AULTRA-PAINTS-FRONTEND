import { env } from '@/env';
import { useAuthStore } from '@/stores/auth-store';

export type ApiError = {
  status: number;
  code?: string;
  message: string;
};

type ApiInit = Omit<RequestInit, 'body'> & {
  body?: unknown;        // JSON-serializable; pass undefined for no body
  skipAuth?: boolean;    // omit the Authorization header (login/OTP endpoints)
};

function buildHeaders(init: ApiInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!init.skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const url = env.apiUrl.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const res = await fetch(url, {
    ...init,
    headers: buildHeaders(init),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  // Normalize errors so TanStack Query's onError sees a consistent shape.
  if (!res.ok) {
    let parsed: { code?: string; message?: string } = {};
    try {
      parsed = (await res.json()) as { code?: string; message?: string };
    } catch {
      /* non-JSON body */
    }
    if (res.status === 401) {
      useAuthStore.getState().logout();
      // Hard navigate to /login so any half-rendered protected page is torn down.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const err: ApiError = {
      status: res.status,
      code: parsed.code,
      message: parsed.message ?? `Request failed (${res.status})`,
    };
    throw err;
  }

  // 204 No Content → return null
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
