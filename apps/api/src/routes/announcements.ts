import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/active", async (_req, res, next) => {
  try {
    const now = new Date();
    const announcement = await prisma.announcement.findFirst({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });
    if (!announcement) {
      res.json({ announcement: null });
      return;
    }
    res.json({
      announcement: {
        id: announcement.id,
        message: announcement.message,
        link: announcement.link,
        linkLabel: announcement.linkLabel,
        color: announcement.color,
        createdAt: announcement.createdAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
