import type { CookieOptions, Response } from "express";
import { env, isProd } from "../env.js";

const ACCESS_COOKIE = "lum_access";
const REFRESH_COOKIE = "lum_refresh";
const ADMIN_COOKIE = "lum_admin";

function baseOpts(): CookieOptions {
  const sameSite = env.COOKIE_SAMESITE;
  return {
    httpOnly: true,
    secure: sameSite === "none" ? true : isProd,
    sameSite,
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
  };
}

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, { ...baseOpts(), maxAge: 15 * 60 * 1000 });
}

export function setRefreshCookie(res: Response, token: string, rememberMe = true) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOpts(),
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseOpts());
  res.clearCookie(REFRESH_COOKIE, baseOpts());
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie(ADMIN_COOKIE, token, { ...baseOpts(), maxAge: 8 * 60 * 60 * 1000 });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE, baseOpts());
}

export const COOKIE_NAMES = {
  ACCESS: ACCESS_COOKIE,
  REFRESH: REFRESH_COOKIE,
  ADMIN: ADMIN_COOKIE,
};
