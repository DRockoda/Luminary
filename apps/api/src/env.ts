import { config as loadEnvFile } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Resolve `apps/api/.env` from this file (`src/` or `dist/`), not `process.cwd()` (fixes local 500s when the API is started from the monorepo root). */
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile({ path: path.join(apiRoot, ".env") });

/** Prisma `schema.prisma` requires `DIRECT_URL`; many hosts only set `DATABASE_URL`. */
if (!process.env.DIRECT_URL?.trim() && process.env.DATABASE_URL?.trim()) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Set it in Vercel → Project → Settings → Environment Variables (or apps/api/.env locally).`,
    );
  }
  return value;
}

/**
 * Ensure upload root exists at process startup (before route modules mkdir avatars, etc.).
 * On Vercel, fall back to `/tmp/uploads` if the configured path is not writable.
 */
function resolveUploadDir(): string {
  let dir =
    process.env.UPLOAD_DIR?.trim() ||
    (process.env.VERCEL ? "/tmp/uploads" : "./uploads");
  const resolved = path.resolve(dir);
  try {
    fs.mkdirSync(resolved, { recursive: true });
    return dir;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[env] UPLOAD_DIR mkdir failed (${resolved}):`, err);
    if (process.env.VERCEL && dir !== "/tmp/uploads") {
      dir = "/tmp/uploads";
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    }
    throw err;
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET", "dev_jwt_secret_change_me_please_1234567890"),
  JWT_REFRESH_SECRET: required(
    "JWT_REFRESH_SECRET",
    "dev_refresh_secret_change_me_please_0987654321",
  ),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  ENCRYPTION_SERVER_KEY: required(
    "ENCRYPTION_SERVER_KEY",
    "0000000000000000000000000000000000000000000000000000000000000000",
  ),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/drive/callback",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  /**
   * Use `none` when the SPA is on a different host than the API (e.g. Netlify → Vercel)
   * so browsers send cookies on credentialed XHR. Requires `Secure` (enabled in production).
   */
  COOKIE_SAMESITE: ((): "strict" | "lax" | "none" => {
    const v = (process.env.COOKIE_SAMESITE ?? "strict").toLowerCase();
    if (v === "lax" || v === "none" || v === "strict") return v;
    return "strict";
  })(),
  /**
   * Set-Cookie `Domain`. Empty omits the attribute (host-only cookies on the API host).
   * On Vercel, defaulting to `localhost` breaks cookie scoping; unset → "" when VERCEL is set.
   */
  COOKIE_DOMAIN: ((): string => {
    const raw = process.env.COOKIE_DOMAIN?.trim();
    if (raw) return raw;
    return process.env.VERCEL ? "" : "localhost";
  })(),
  /** Writable media root; created on startup (see `resolveUploadDir`). */
  UPLOAD_DIR: resolveUploadDir(),
  ADMIN_JWT_SECRET: required(
    "ADMIN_JWT_SECRET",
    "dev_admin_jwt_secret_change_me_aaaabbbbccccddddeeeeffff111122223333",
  ),
  ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN ?? "8h",
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "Luminary <noreply@luminary.local>",
  APP_URL: process.env.APP_URL ?? "http://localhost:5173",
};

export const isProd = env.NODE_ENV === "production";
