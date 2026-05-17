import { env } from '@/env';
import { useAuthStore } from '@/stores/auth-store';

// Navigation bridge: app boot registers React Router's `navigate` here so
// 401 redirects use the SPA router instead of a full page reload (which
// would wipe TanStack Query cache + in-flight form input).
type Navigator = (path: string, options?: { replace?: boolean }) => void;
let navigateImpl: Navigator | null = null;
export function setApiNavigate(fn: Navigator | null) {
  navigateImpl = fn;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

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
  // If `path` is already absolute (caller passed a full URL, e.g. a presigned
  // upload URL), use it directly. Otherwise build a URL from apiUrl + path.
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : new URL(
        path.replace(/^\//, ''),
        env.apiUrl.endsWith('/') ? env.apiUrl : env.apiUrl + '/',
      ).toString();
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
      if (navigateImpl) {
        if (typeof window === 'undefined' || window.location.pathname !== '/login') {
          navigateImpl('/login', { replace: true });
        }
      } else if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new ApiError(
      res.status,
      parsed.message ?? `Request failed (${res.status})`,
      parsed.code,
    );
  }

  // 204 No Content → return null
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
