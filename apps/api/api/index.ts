import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import { app } from "../src/app.js";

const handler = serverless(app);

/**
 * Async entry so Vercel treats the export as a function.
 * Do not call `prisma.$disconnect()` after each request — concurrent invocations
 * on a warm instance can overlap; Prisma expects a long-lived client in serverless.
 */
export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  return handler(req as never, res as never);
}
