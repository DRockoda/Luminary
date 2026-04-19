import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { forbidden, unauthorized } from "../lib/errors.js";

/**
 * Blocks write actions until the user has verified their email.
 * Use after `requireAuth`.
 */
export async function requireVerifiedEmail(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) return next(unauthorized());
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { emailVerified: true },
    });
    if (!user) return next(unauthorized());
    if (!user.emailVerified) {
      return next(forbidden("Please verify your email to perform this action."));
    }
    next();
  } catch (err) {
    next(err);
  }
}
