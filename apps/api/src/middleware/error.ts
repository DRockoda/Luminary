import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code ?? "ERROR",
      details: err.details,
    });
  }
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error", code: "INTERNAL" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
}
