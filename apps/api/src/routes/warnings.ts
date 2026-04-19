import { Router } from "express";
import { prisma } from "../db.js";
import { notFound } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.userWarning.findMany({
      where: { userId: req.userId!, isDismissed: false },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      warnings: items.map((w) => ({
        id: w.id,
        message: w.message,
        level: w.level,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/dismiss", async (req, res, next) => {
  try {
    const warning = await prisma.userWarning.findUnique({ where: { id: req.params.id } });
    if (!warning || warning.userId !== req.userId) throw notFound("Warning not found");
    await prisma.userWarning.update({
      where: { id: warning.id },
      data: { isDismissed: true },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
