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

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAMES.ACCESS];
  if (!token) return next(unauthorized("Not authenticated"));
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
