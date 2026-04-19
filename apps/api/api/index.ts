import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | undefined;
let bootError: Error | undefined;
let bootPromise: Promise<void> | undefined;

function sendJsonError(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  if (res.headersSent) return;
  res.status(status);
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function ensureBoot(): Promise<void> {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    try {
      const { app } = await import("../src/app.js");
      handler = serverless(app);
    } catch (e) {
      bootError = e instanceof Error ? e : new Error(String(e));
      // eslint-disable-next-line no-console
      console.error("[luminary-api] bootstrap failed:", bootError);
    }
  })();

  return bootPromise;
}

/**
 * Lazy-load the Express app so a misconfiguration (missing env, mkdir failure, etc.)
 * returns JSON instead of FUNCTION_INVOCATION_FAILED with no body.
 */
export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    await ensureBoot();

    if (!handler) {
      sendJsonError(res, 503, {
        ok: false,
        code: "SERVICE_BOOTSTRAP_FAILED",
        message: bootError?.message ?? "Application failed to start.",
        hint: "Check Vercel env: DATABASE_URL, DIRECT_URL, JWT_SECRET, ENCRYPTION_SERVER_KEY, etc.",
      });
      return;
    }

    await Promise.resolve(handler(req as never, res as never));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    // eslint-disable-next-line no-console
    console.error("[luminary-api] request handling error:", err);
    if (!res.headersSent) {
      sendJsonError(res, 500, {
        ok: false,
        code: "INTERNAL",
        message: err.message,
      });
    }
  }
}
