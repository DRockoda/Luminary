import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyAdminToken } from "../lib/adminJwt.js";

export const ADMIN_COOKIE = "lum_admin";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminId?: string;
      adminUsername?: string;
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = (req.cookies as Record<string, string> | undefined)?.[ADMIN_COOKIE];
  if (!token) return next(unauthorized("Admin not authenticated"));
  try {
    const payload = verifyAdminToken(token);
    req.adminId = payload.sub;
    req.adminUsername = payload.username;
    next();
  } catch {
    next(unauthorized("Invalid or expired admin token"));
  }
}
