import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import {
  createMediaEntrySchema,
  createTextEntrySchema,
  dateStringSchema,
  updateEntrySchema,
} from "@luminary/shared";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { decryptString } from "../lib/crypto.js";
import { badRequest, notFound } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { requireVerifiedEmail } from "../middleware/verified.js";
import { unlinkUploadFile } from "../services/entryMedia.js";
import {
  encryptEntryContent,
  toJournalEntry,
} from "../services/entryService.js";

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".webm";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(requireAuth);
router.use(requireVerifiedEmail);

function activeWhere(userId: string, extra: Record<string, unknown> = {}) {
  return { userId, deletedAt: null, ...extra };
}

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      res.json({ entries: [] });
      return;
    }
    const userId = req.userId!;
    const entries = await prisma.entry.findMany({
      where: activeWhere(userId),
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    const lower = q.toLowerCase();
    const matched = entries.filter((e) => {
      if ((e.title ?? "").toLowerCase().includes(lower)) return true;
      if (e.date.includes(q)) return true;
      if (e.type === "text" && e.content) {
        try {
          const plain = decryptString(e.content);
          if (plain.toLowerCase().includes(lower)) return true;
        } catch {
          return false;
        }
      }
      return false;
    });
    res.json({ entries: matched.map((e) => toJournalEntry(e)) });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { date, from, to } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = activeWhere(req.userId!);
    if (date) {
      dateStringSchema.parse(date);
      where.date = date;
    } else if (from && to) {
      dateStringSchema.parse(from);
      dateStringSchema.parse(to);
      where.date = { gte: from, lte: to };
    }
    const entries = await prisma.entry.findMany({
      where: where as never,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    res.json({ entries: entries.map((e) => toJournalEntry(e)) });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = createTextEntrySchema.parse(req.body);
    const encrypted = encryptEntryContent(body.content);
    const entry = await prisma.entry.create({
      data: {
        userId: req.userId!,
        date: body.date,
        type: "text",
        title: body.title?.trim() || null,
        content: encrypted,
        moodScore: body.mood,
        fileSizeBytes: Buffer.byteLength(encrypted, "utf8"),
      },
    });
    res.status(201).json({ entry: toJournalEntry(entry) });
  } catch (err) {
    next(err);
  }
});

router.post("/media", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest("File is required");
    const body = createMediaEntrySchema.parse({
      date: req.body.date,
      type: req.body.type,
      title: req.body.title || undefined,
      durationSeconds: req.body.durationSeconds
        ? Number(req.body.durationSeconds)
        : undefined,
      mood: req.body.mood,
    });
    const mediaUrl = `/uploads/${req.file.filename}`;
    const entry = await prisma.entry.create({
      data: {
        userId: req.userId!,
        date: body.date,
        type: body.type,
        title: body.title?.trim() || null,
        durationSeconds: body.durationSeconds ?? null,
        mediaUrl,
        moodScore: body.mood,
        fileSizeBytes: req.file.size ?? null,
      },
    });
    res.status(201).json({ entry: toJournalEntry(entry) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/trash", async (req, res, next) => {
  try {
    const existing = await prisma.entry.findFirst({
      where: { id: req.params.id, userId: req.userId!, deletedAt: null },
    });
    if (!existing) throw notFound("Entry not found");
    await prisma.entry.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateEntrySchema.parse(req.body);
    const existing = await prisma.entry.findFirst({
      where: { id: req.params.id, userId: req.userId!, deletedAt: null },
    });
    if (!existing) throw notFound("Entry not found");
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) {
      if (existing.type !== "text") throw badRequest("Only text entries have content");
      data.content = body.content ? encryptEntryContent(body.content) : null;
    }
    if (body.mood !== undefined) data.moodScore = body.mood;
    const updated = await prisma.entry.update({
      where: { id: existing.id },
      data: data as never,
    });
    res.json({ entry: toJournalEntry(updated) });
  } catch (err) {
    next(err);
  }
});

export default router;
