/**
 * In-memory access JWT + sessionStorage refresh backup for cross-origin flows
 * where httpOnly cookies may not attach reliably (Netlify SPA → Render API).
 * Keeps `api.ts` free of importing `authStore` (circular deps).
 */

const REFRESH_STORAGE_KEY = "_rt";

let memoryAccessToken: string | null = null;

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function getPersistedRefreshToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(REFRESH_STORAGE_KEY);
}

export function persistRefreshToken(refresh: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  if (refresh) sessionStorage.setItem(REFRESH_STORAGE_KEY, refresh);
  else sessionStorage.removeItem(REFRESH_STORAGE_KEY);
}

export function clearClientAuthSession(): void {
  memoryAccessToken = null;
  persistRefreshToken(null);
}
