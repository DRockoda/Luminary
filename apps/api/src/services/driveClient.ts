import { Readable } from "node:stream";
import { google, type drive_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { env } from "../env.js";
import { decryptString } from "../lib/crypto.js";

/**
 * Scopes used by Luminary.
 *  - drive.appdata: per-app hidden folder. Files are stored in the user's Drive
 *    quota but invisible from the regular Drive UI and inaccessible to other apps.
 *  - userinfo.email: so we can show the connected Google address in Settings.
 */
export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function isDriveConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function buildOAuthClient(): OAuth2Client {
  if (!isDriveConfigured()) {
    throw new Error("Google Drive OAuth is not configured on the server");
  }
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

/** Returns an authorized client for an existing user (uses stored encrypted refresh token). */
export function clientForRefreshToken(encryptedRefreshToken: string): OAuth2Client {
  const refreshToken = decryptString(encryptedRefreshToken);
  const client = buildOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function driveFor(client: OAuth2Client): drive_v3.Drive {
  return google.drive({ version: "v3", auth: client });
}

export async function getConnectedEmail(client: OAuth2Client): Promise<string | null> {
  try {
    const info = await google.oauth2({ version: "v2", auth: client }).userinfo.get();
    return info.data.email ?? null;
  } catch {
    return null;
  }
}

/** Streams a file out of the appDataFolder for archiving. */
export async function downloadDriveFileStream(
  client: OAuth2Client,
  fileId: string,
): Promise<Readable> {
  const drive = driveFor(client);
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: false },
    { responseType: "stream" },
  );
  return res.data as Readable;
}

/** Lists files in the appDataFolder (for housekeeping/debug — not used in hot paths). */
export async function listAppDataFiles(
  client: OAuth2Client,
): Promise<drive_v3.Schema$File[]> {
  const drive = driveFor(client);
  const res = await drive.files.list({
    spaces: "appDataFolder",
    fields: "files(id, name, size, mimeType, createdTime)",
    pageSize: 1000,
  });
  return res.data.files ?? [];
}
