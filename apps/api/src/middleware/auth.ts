import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAMES } from "../lib/cookies.js";
import { unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function readAccessToken(req: Request): string | undefined {
  const fromCookie = (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAMES.ACCESS];
  if (fromCookie) return fromCookie;
  const authz = req.headers.authorization;
  if (typeof authz === "string" && authz.startsWith("Bearer ")) {
    const t = authz.slice(7).trim();
    if (t) return t;
  }
  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessToken(req);
  if (!token) return next(unauthorized("Not authenticated"));
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
  } catch {
    req.userId = undefined;
  }
  next();
}
