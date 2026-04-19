import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";

type ServerlessHandler = ReturnType<typeof serverless>;

let handler: ServerlessHandler | undefined;

async function getHandler(): Promise<ServerlessHandler> {
  if (!handler) {
    const { app } = await import("../src/app.js");
    handler = serverless(app);
  }
  return handler;
}

/**
 * Vercel requires a **function** (or Node `Server`) as the default export for this route.
 * Do not default-export the Express `app` from here or from `app.ts`.
 */
export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  try {
    const h = await getHandler();
    return h(req as never, res as never);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error("[luminary-api] bootstrap or handler error:", err);
    if (!res.headersSent) {
      res.status(503);
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: false,
          code: "SERVICE_BOOTSTRAP_FAILED",
          message,
          hint: "Check Vercel env: DATABASE_URL, DIRECT_URL, JWT_SECRET, ENCRYPTION_SERVER_KEY, etc.",
        }),
      );
    }
    return undefined;
  }
}
