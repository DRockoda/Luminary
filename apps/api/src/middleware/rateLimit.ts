import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { tooMany } from "../lib/errors.js";

/** Production: strict. Local/dev: generous so one IP (localhost) is not locked out while testing. */
const isProd = process.env.NODE_ENV === "production";
const authLimiter = new RateLimiterMemory(
  isProd
    ? { points: 10, duration: 15 * 60 }
    : { points: 500, duration: 60 },
);

export function authRateLimit(req: Request, _res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  authLimiter
    .consume(key)
    .then(() => next())
    .catch(() => next(tooMany("Too many attempts. Try again in 15 minutes.")));
}
