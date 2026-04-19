import type { Entry } from "@prisma/client";
import type { JournalEntry, MoodScore } from "@luminary/shared";
import { decryptString, encryptString } from "../lib/crypto.js";

function clampMoodScore(n: number): MoodScore {
  const x = Math.round(Number(n));
  if (x < 1) return 1;
  if (x > 10) return 10;
  return x as MoodScore;
}

export function toJournalEntry(entry: Entry, decryptContent = true): JournalEntry {
  let content: string | null = entry.content;
  if (decryptContent && entry.type === "text" && content) {
    try {
      content = decryptString(content);
    } catch {
      content = "[unable to decrypt]";
    }
  }
  return {
    id: entry.id,
    userId: entry.userId,
    date: entry.date,
    type: entry.type as JournalEntry["type"],
    title: entry.title,
    content,
    mediaUrl: entry.mediaUrl,
    driveFileId: entry.driveFileId,
    durationSeconds: entry.durationSeconds,
    thumbnailUrl: entry.thumbnailUrl,
    mood: clampMoodScore(entry.moodScore ?? 5),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    deletedAt: entry.deletedAt ? entry.deletedAt.toISOString() : null,
  };
}

export function encryptEntryContent(plaintext: string): string {
  return encryptString(plaintext);
}
