import archiver from "archiver";
import { format } from "date-fns";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { decryptString } from "../lib/crypto.js";
import { requireAuth } from "../middleware/auth.js";
import {
  clientForRefreshToken,
  downloadDriveFileStream,
  isDriveConfigured,
} from "../services/driveClient.js";

const router = Router();
router.use(requireAuth);

interface EstimateBucket {
  count: number;
  bytes: number;
  seconds: number;
}

async function estimateBuckets(userId: string): Promise<{
  text: EstimateBucket;
  audio: EstimateBucket;
  video: EstimateBucket;
}> {
  const entries = await prisma.entry.findMany({
    where: { userId, deletedAt: null },
    select: {
      type: true,
      content: true,
      driveFileSize: true,
      fileSizeBytes: true,
      durationSeconds: true,
    },
  });
  const text: EstimateBucket = { count: 0, bytes: 0, seconds: 0 };
  const audio: EstimateBucket = { count: 0, bytes: 0, seconds: 0 };
  const video: EstimateBucket = { count: 0, bytes: 0, seconds: 0 };

  for (const e of entries) {
    if (e.type === "text") {
      text.count++;
      // Approximate decrypted text byte size as 75% of ciphertext (base64
      // overhead is ~33%, plus the 12-byte IV and 16-byte tag headers).
      text.bytes += e.content
        ? Math.max(0, Math.floor(Buffer.byteLength(e.content, "utf8") * 0.75))
        : 0;
    } else if (e.type === "audio") {
      audio.count++;
      audio.bytes += e.driveFileSize ?? e.fileSizeBytes ?? 0;
      audio.seconds += e.durationSeconds ?? 0;
    } else if (e.type === "video") {
      video.count++;
      video.bytes += e.driveFileSize ?? e.fileSizeBytes ?? 0;
      video.seconds += e.durationSeconds ?? 0;
    }
  }

  return { text, audio, video };
}

router.get("/estimate", async (req, res, next) => {
  try {
    const buckets = await estimateBuckets(req.userId!);
    res.json({
      textCount: buckets.text.count,
      textBytes: buckets.text.bytes,
      audioCount: buckets.audio.count,
      audioBytes: buckets.audio.bytes,
      audioSeconds: buckets.audio.seconds,
      videoCount: buckets.video.count,
      videoBytes: buckets.video.bytes,
      videoSeconds: buckets.video.seconds,
      totalCount:
        buckets.text.count + buckets.audio.count + buckets.video.count,
      totalBytes:
        buckets.text.bytes + buckets.audio.bytes + buckets.video.bytes,
    });
  } catch (err) {
    next(err);
  }
});

const moodLabel = (score: number | null | undefined): string => {
  const n = score ?? 5;
  if (n >= 9) return "Great";
  if (n >= 7) return "Good";
  if (n >= 5) return "Okay";
  if (n >= 3) return "Low";
  return "Bad";
};

function safeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 60);
}

function generateReadme(totals: {
  total: number;
  text: number;
  audio: number;
  video: number;
}): string {
  return `Luminary Data Export
Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
Total entries: ${totals.total}
  - Text: ${totals.text}
  - Audio: ${totals.audio}
  - Video: ${totals.video}

This archive contains all of your Luminary journal entries.

FILE FORMAT
  • Text entries are stored as readable .txt files.
  • Audio entries are stored as .webm files.
  • Video entries are stored as .webm files.
  • Files are organised by year/month folders.
  • Filenames include the date and time of the entry for easy sorting.

METADATA
  • See metadata.json for a complete index of all entries
    including moods, timestamps and titles.

To play audio/video files, most modern media players will work
(VLC, QuickTime, or your web browser).

Thank you for using Luminary.
`;
}

const exportSchema = z.object({
  includeText: z.boolean().default(true),
  includeAudio: z.boolean().default(true),
  includeVideo: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
});

/** Streamed ZIP export. */
router.post("/zip", async (req, res, next) => {
  try {
    const opts = exportSchema.parse(req.body ?? {});
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const entries = await prisma.entry.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    // Optional Drive client for media files
    const driveClient =
      user.driveRefreshToken && isDriveConfigured()
        ? (() => {
            try {
              return clientForRefreshToken(user.driveRefreshToken!);
            } catch {
              return null;
            }
          })()
        : null;

    const stamp = format(new Date(), "yyyy-MM-dd");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="luminary-export-${stamp}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("warning", (err) => {
      if (err.code !== "ENOENT") throw err;
    });
    archive.on("error", (err) => {
      // Once piped, the only sensible thing is to terminate the response.
      res.destroy(err);
    });
    archive.pipe(res);

    const totals = {
      total: entries.length,
      text: entries.filter((e) => e.type === "text").length,
      audio: entries.filter((e) => e.type === "audio").length,
      video: entries.filter((e) => e.type === "video").length,
    };
    archive.append(generateReadme(totals), { name: "README.txt" });

    if (opts.includeMetadata) {
      const metadata = entries.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        title: e.title,
        moodScore: e.moodScore,
        moodLabel: moodLabel(e.moodScore),
        durationSeconds: e.durationSeconds,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }));
      archive.append(JSON.stringify(metadata, null, 2), {
        name: "metadata.json",
      });
    }

    for (const entry of entries) {
      const dateObj = new Date(entry.date);
      const yearFolder = format(dateObj, "yyyy");
      const monthFolder = format(dateObj, "MM-MMMM");
      const titleSlug = entry.title
        ? safeFilename(entry.title.replace(/\s+/g, "-").toLowerCase())
        : entry.type;
      const filenameBase = `${entry.date}_${format(entry.createdAt, "HHmm")}_${titleSlug}`;

      if (entry.type === "text" && opts.includeText) {
        let plaintext = "";
        if (entry.content) {
          try {
            plaintext = decryptString(entry.content);
          } catch {
            plaintext = "[unable to decrypt this entry]";
          }
        }
        const txt = [
          `Title: ${entry.title ?? "Untitled"}`,
          `Date: ${entry.date}`,
          `Time: ${format(entry.createdAt, "h:mm a")}`,
          `Mood: ${moodLabel(entry.moodScore)} (${entry.moodScore}/10)`,
          "",
          plaintext,
        ].join("\n");
        archive.append(txt, {
          name: `${yearFolder}/${monthFolder}/${filenameBase}.txt`,
        });
      } else if (
        entry.type === "audio" &&
        opts.includeAudio &&
        entry.driveFileId &&
        driveClient
      ) {
        try {
          const stream = await downloadDriveFileStream(
            driveClient,
            entry.driveFileId,
          );
          archive.append(stream, {
            name: `${yearFolder}/${monthFolder}/${filenameBase}.webm`,
          });
        } catch {
          // Skip silently if a single file can't be fetched.
        }
      } else if (
        entry.type === "video" &&
        opts.includeVideo &&
        entry.driveFileId &&
        driveClient
      ) {
        try {
          const stream = await downloadDriveFileStream(
            driveClient,
            entry.driveFileId,
          );
          archive.append(stream, {
            name: `${yearFolder}/${monthFolder}/${filenameBase}.webm`,
          });
        } catch {
          /* skip */
        }
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
});

/** Legacy JSON export — kept for older clients. */
router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const [user, entries, moods] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.entry.findMany({
        where: { userId, deletedAt: null },
        orderBy: { date: "asc" },
      }),
      prisma.moodLog.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    ]);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="luminary-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          user: user
            ? {
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt,
              }
            : null,
          entries,
          moods,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
