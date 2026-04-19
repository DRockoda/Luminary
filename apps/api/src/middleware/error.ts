import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

function logPrismaError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // eslint-disable-next-line no-console
    console.error("[prisma]", err.code, err.message, err.meta);
    return true;
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    // eslint-disable-next-line no-console
    console.error("[prisma]", "initialization", err.message);
    return true;
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    // eslint-disable-next-line no-console
    console.error("[prisma]", "unknown_request", err.message);
    return true;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    // eslint-disable-next-line no-console
    console.error("[prisma]", "validation", err.message);
    return true;
  }
  return false;
}

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
  if (logPrismaError(err)) {
    return res.status(500).json({ error: "Internal server error", code: "DATABASE_ERROR" });
  }
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error", code: "INTERNAL" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
}
