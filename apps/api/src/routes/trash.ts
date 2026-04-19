import { Router } from "express";
import { prisma } from "../db.js";
import { notFound } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { unlinkUploadFile } from "../services/entryMedia.js";
import { toJournalEntry } from "../services/entryService.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const entries = await prisma.entry.findMany({
      where: { userId: req.userId!, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    });
    res.json({ entries: entries.map((e) => toJournalEntry(e)) });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/restore", async (req, res, next) => {
  try {
    const existing = await prisma.entry.findFirst({
      where: { id: req.params.id, userId: req.userId!, deletedAt: { not: null } },
    });
    if (!existing) throw notFound("Entry not found");
    const updated = await prisma.entry.update({
      where: { id: existing.id },
      data: { deletedAt: null },
    });
    res.json({ entry: toJournalEntry(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete("/empty", async (req, res, next) => {
  try {
    const trashed = await prisma.entry.findMany({
      where: { userId: req.userId!, deletedAt: { not: null } },
    });
    for (const e of trashed) unlinkUploadFile(e.mediaUrl);
    await prisma.entry.deleteMany({
      where: { userId: req.userId!, deletedAt: { not: null } },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.entry.findFirst({
      where: { id: req.params.id, userId: req.userId!, deletedAt: { not: null } },
    });
    if (!existing) throw notFound("Entry not found");
    unlinkUploadFile(existing.mediaUrl);
    await prisma.entry.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
