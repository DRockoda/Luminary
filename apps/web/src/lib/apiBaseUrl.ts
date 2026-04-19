/**
 * Resolves axios `baseURL` for the Luminary API.
 *
 * **Local dev:** If `VITE_API_URL` points at the default API host (`localhost` /
 * `127.0.0.1` :3000), return `""` so requests go to the same origin as the Vite
 * dev server (`/api/...`) and are proxied by `vite.config.ts`. That avoids
 * cross-origin + cookie issues that often surface as Axios "Network Error".
 *
 * **Production:** Use the full `https://…` API origin from Netlify/Vercel env.
 */
export function resolveApiBaseURL(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!raw) return "";

  if (import.meta.env.DEV) {
    try {
      const u = new URL(raw);
      const hostOk = u.hostname === "localhost" || u.hostname === "127.0.0.1";
      const portOk = u.port === "3000" || u.port === "";
      if (hostOk && portOk) return "";
    } catch {
      return raw;
    }
  }

  return raw;
}
