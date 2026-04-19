import fs from "node:fs";
import path from "node:path";
import { env } from "../env.js";

/** Best-effort remove a locally stored upload (media or avatar). */
export function unlinkUploadFile(mediaUrl: string | null | undefined): void {
  if (!mediaUrl?.startsWith("/uploads/")) return;
  const rel = mediaUrl.replace(/^\/uploads\//, "");
  const filePath = path.join(env.UPLOAD_DIR, rel);
  fs.promises.unlink(filePath).catch(() => undefined);
}
