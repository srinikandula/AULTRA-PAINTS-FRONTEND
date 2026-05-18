// Pure helpers — no DOM, no React, no store deps. Used by the auth store
// when it persists/rehydrates and by route guards if they need to peek at
// the token without subscribing to the store.

export type JwtPayload = {
  _id?: string;
  mobile?: string;
  accountType?: 'SuperUser' | 'SalesExecutive' | 'Dealer' | 'Painter';
  exp?: number;
  iat?: number;
  [k: string]: unknown;
};

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    // base64url → base64 (replace -/_ then pad)
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = atob(b64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  if (typeof payload.exp !== 'number') return false;   // no exp → don't expire client-side
  return payload.exp < nowSeconds;
}
