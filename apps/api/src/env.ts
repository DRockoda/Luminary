import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
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
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ?? "localhost",
  /**
   * Vercel serverless allows writes only under `/tmp`. Creating `./uploads` at
   * app import time throws (EACCES / EROFS) and breaks every route with 500.
   */
  UPLOAD_DIR: process.env.UPLOAD_DIR
    ? process.env.UPLOAD_DIR
    : process.env.VERCEL
      ? "/tmp/uploads"
      : "./uploads",
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
