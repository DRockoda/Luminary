import { prisma } from "../db.js";
import { unlinkUploadFile } from "./entryMedia.js";

const RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

export async function purgeExpiredTrash(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  const expired = await prisma.entry.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });
  for (const e of expired) {
    unlinkUploadFile(e.mediaUrl);
  }
  const result = await prisma.entry.deleteMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });
  return result.count;
}

async function runPurgeSafely(): Promise<void> {
  try {
    await purgeExpiredTrash();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Trash purge failed — database may not be ready:", message);
  }
}

export function startTrashPurgeScheduler(): void {
  void runPurgeSafely();
  setInterval(() => {
    void runPurgeSafely();
  }, 24 * 60 * 60 * 1000);
}
