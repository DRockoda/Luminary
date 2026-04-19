import { Router } from "express";
import {
  MOODS,
  MOOD_META,
  dateStringSchema,
  moodLogSchema,
  moodFromScore,
  type MoodValue,
  type MoodTag,
  type MoodSummary,
} from "@luminary/shared";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { from, to } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = { userId: req.userId! };
    if (from && to) {
      dateStringSchema.parse(from);
      dateStringSchema.parse(to);
      where.date = { gte: from, lte: to };
    }
    const logs = await prisma.moodLog.findMany({
      where: where as never,
      orderBy: { date: "asc" },
    });
    res.json({
      moods: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        date: l.date,
        mood: l.mood as MoodTag,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = moodLogSchema.parse(req.body);
    const existing = await prisma.moodLog.findUnique({
      where: { userId_date: { userId: req.userId!, date: body.date } },
    });
    const log = existing
      ? await prisma.moodLog.update({
          where: { id: existing.id },
          data: { mood: body.mood },
        })
      : await prisma.moodLog.create({
          data: { userId: req.userId!, date: body.date, mood: body.mood },
        });
    res.json({
      mood: {
        id: log.id,
        userId: log.userId,
        date: log.date,
        mood: log.mood as MoodTag,
        createdAt: log.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const period = (req.query.period as string) || "week";
    if (!["week", "month", "year"].includes(period)) {
      return res.status(400).json({ error: "Invalid period" });
    }
    const now = new Date();
    const from = new Date(now);
    if (period === "week") from.setDate(now.getDate() - 6);
    else if (period === "month") from.setDate(now.getDate() - 29);
    else from.setDate(now.getDate() - 364);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = now.toISOString().slice(0, 10);
    const entries = await prisma.entry.findMany({
      where: {
        userId: req.userId!,
        deletedAt: null,
        date: { gte: fromStr, lte: toStr },
      },
      select: { date: true, moodScore: true },
    });
    const byDate = new Map<string, number[]>();
    for (const e of entries) {
      const arr = byDate.get(e.date) ?? [];
      arr.push(e.moodScore);
      byDate.set(e.date, arr);
    }
    const dayMoods: MoodValue[] = [];
    for (const scores of byDate.values()) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      dayMoods.push(moodFromScore(avg));
    }
    const distribution = Object.fromEntries(MOODS.map((m) => [m, 0])) as Record<MoodValue, number>;
    let totalScore = 0;
    for (const m of dayMoods) {
      distribution[m] = (distribution[m] ?? 0) + 1;
      totalScore += MOOD_META[m].score;
    }
    const totalCount = dayMoods.length;
    const distPct = Object.fromEntries(
      MOODS.map((m) => [m, totalCount ? (distribution[m] / totalCount) * 100 : 0]),
    ) as Record<MoodValue, number>;
    const averageScore = totalCount ? totalScore / totalCount : 0;
    const summary: MoodSummary = {
      period: period as MoodSummary["period"],
      averageScore,
      averageMood: totalCount ? moodFromScore(averageScore) : null,
      distribution: distPct,
      daysLogged: totalCount,
    };
    res.json({ summary });
  } catch (err) {
    next(err);
  }
});

export default router;
