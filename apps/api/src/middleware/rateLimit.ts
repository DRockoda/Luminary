import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { tooMany } from "../lib/errors.js";

const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 15 * 60, // 15 min
});

export function authRateLimit(req: Request, _res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  authLimiter
    .consume(key)
    .then(() => next())
    .catch(() => next(tooMany("Too many attempts. Try again in 15 minutes.")));
}
