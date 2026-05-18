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
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: buildHeaders(init),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (err) {
    // fetch() rejects (TypeError 'Failed to fetch') for: network drop, DNS,
    // CORS preflight failure, request body too large for the server (some
    // proxies close the connection before responding). Surface a useful
    // hint instead of the raw browser string.
    const raw = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(
      0,
      raw === 'Failed to fetch'
        ? 'Could not reach the server. The request may be too large, the network may be down, or CORS is blocking it.'
        : raw,
    );
  }

  // Normalize errors so TanStack Query's onError sees a consistent shape.
  if (!res.ok) {
    let parsed: { code?: string; message?: string; error?: string } = {};
    const bodyText = await res.text().catch(() => '');
    if (bodyText) {
      try {
        const json = JSON.parse(bodyText) as Record<string, unknown>;
        parsed = {
          code: typeof json.code === 'string' ? json.code : undefined,
          // Many backend handlers in this codebase return `{message}`, a few
          // return `{error}`. Prefer message; fall back to error.
          message:
            typeof json.message === 'string' ? json.message :
            typeof json.error === 'string' ? json.error :
            undefined,
        };
      } catch {
        // Non-JSON body (e.g. Express default error HTML, or a plain text
        // 'PayloadTooLargeError'). Surface a trimmed snippet rather than
        // dropping it on the floor.
        const trimmed = bodyText.trim();
        if (trimmed && !trimmed.startsWith('<')) {
          parsed.message = trimmed.slice(0, 200);
        }
      }
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
    // Friendly fallbacks for common opaque cases.
    const fallback =
      res.status === 413 ? 'Image is too large for the server (try a smaller file).' :
      res.status === 504 || res.status === 0 ? 'Server did not respond. Try again.' :
      `Request failed (${res.status})`;
    throw new ApiError(
      res.status,
      parsed.message ?? fallback,
      parsed.code,
    );
  }

  // 204 No Content → return null
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
