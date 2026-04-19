import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { encryptString } from "../lib/crypto.js";
import { badRequest } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { signAccessToken } from "../lib/jwt.js";
import {
  DRIVE_SCOPES,
  buildOAuthClient,
  clientForRefreshToken,
  getAppDataStorageBytes,
  getConnectedEmail,
  isDriveConfigured,
} from "../services/driveClient.js";
import { toPublicUser } from "../services/userService.js";

const router = Router();

/** SPA origin for post-OAuth redirects (Netlify). Prefer APP_URL, then first CORS origin. */
function spaOriginForDriveRedirect(): string {
  const app = env.APP_URL?.trim();
  if (app) return app.replace(/\/$/, "");
  const first = env.CORS_ORIGIN.split(",")[0]?.trim();
  if (first) return first.replace(/\/$/, "");
  return "http://localhost:5173";
}

/**
 * Note on scope: we use the `drive.appdata` scope. Files are stored in a
 * per-app hidden folder that's invisible to the user via the regular Drive UI
 * and inaccessible to other apps. To read/list files we always pass
 * `spaces: "appDataFolder"` and `parents: ["appDataFolder"]` on uploads.
 */

router.get("/connect", requireAuth, (req, res) => {
  if (!isDriveConfigured()) {
    return res.status(501).json({
      error: "Google Drive is not configured on the server",
      code: "DRIVE_NOT_CONFIGURED",
    });
  }

  // Stateless state token = a short-lived JWT bound to this user.
  const state = signAccessToken(req.userId!);
  const oauth2 = buildOAuthClient();
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token to be returned
    scope: DRIVE_SCOPES,
    state,
    include_granted_scopes: true,
  });
  res.json({ url });
});

router.get("/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>;
    if (error) {
      return res.redirect(
        `${spaOriginForDriveRedirect()}/app/settings?tab=storage&drive=error&reason=${encodeURIComponent(error)}`,
      );
    }
    if (!code || !state) throw badRequest("Missing OAuth code or state");
    if (!isDriveConfigured()) throw badRequest("Drive not configured");

    // Verify the state JWT and recover the userId without requiring a cookie.
    const { verifyAccessToken } = await import("../lib/jwt.js");
    let userId: string;
    try {
      const payload = verifyAccessToken(state);
      userId = payload.sub;
    } catch {
      throw badRequest("Invalid OAuth state");
    }

    const oauth2 = buildOAuthClient();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      // Without a refresh token we cannot keep the connection alive.
      // Send the user back with an actionable error.
      return res.redirect(
        `${spaOriginForDriveRedirect()}/app/settings?tab=storage&drive=error&reason=no_refresh_token`,
      );
    }
    oauth2.setCredentials(tokens);
    const email = await getConnectedEmail(oauth2);
    const encrypted = encryptString(tokens.refresh_token);
    await prisma.user.update({
      where: { id: userId },
      data: {
        driveRefreshToken: encrypted,
        driveConnected: true,
        driveEmail: email,
      },
    });
    res.redirect(`${spaOriginForDriveRedirect()}/app/settings?tab=storage&drive=connected`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[drive/callback]", err);
    return res.redirect(
      `${spaOriginForDriveRedirect()}/app/settings?tab=storage&drive=error&reason=auth_failed`,
    );
  }
});

router.post("/disconnect", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw badRequest("User not found");

    // Best-effort token revoke (don't fail disconnect if Google rejects it).
    if (user.driveRefreshToken && isDriveConfigured()) {
      try {
        const client = clientForRefreshToken(user.driveRefreshToken);
        await client.revokeCredentials();
      } catch {
        /* ignore — we'll still clear local state */
      }
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        driveRefreshToken: null,
        driveConnected: false,
        driveEmail: null,
        driveLastSyncAt: null,
      },
    });
    res.json({ ok: true, user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.json({ connected: false });
    const connected =
      user.driveConnected && Boolean(user.driveRefreshToken) && isDriveConfigured();
    res.json({
      connected,
      configured: isDriveConfigured(),
      email: user.driveEmail,
      syncMode: user.driveSyncMode,
      lastSyncedAt: user.driveLastSyncAt?.toISOString() ?? null,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/storage", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { driveConnected: true, driveRefreshToken: true },
    });
    if (!user?.driveConnected || !user.driveRefreshToken || !isDriveConfigured()) {
      return res.json({ storageBytes: 0 });
    }
    try {
      const client = clientForRefreshToken(user.driveRefreshToken);
      const storageBytes = await getAppDataStorageBytes(client);
      return res.json({ storageBytes });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[drive/storage]", err);
      return res.json({ storageBytes: 0, stale: true });
    }
  } catch (err) {
    next(err);
  }
});

const syncModeSchema = z.object({
  syncMode: z.enum(["on-save", "hourly", "daily", "manual"]),
});

router.patch("/settings", requireAuth, async (req, res, next) => {
  try {
    const body = syncModeSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { driveSyncMode: body.syncMode },
    });
    res.json({ ok: true, user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.post("/sync", requireAuth, async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { driveLastSyncAt: new Date() },
    });
    res.json({ ok: true, syncedAt: updated.driveLastSyncAt?.toISOString() });
  } catch (err) {
    next(err);
  }
});

export default router;
