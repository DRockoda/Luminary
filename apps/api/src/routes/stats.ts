import { Router } from "express";
import type {
  EntryBreakdown,
  HeatmapCell,
  StreakStats,
} from "@luminary/shared";
import { moodFromScore } from "@luminary/shared";
import {
  differenceInCalendarDays,
  endOfDay,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";
import { prisma } from "../db.js";
import { decryptString } from "../lib/crypto.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

type SummaryPeriod = "week" | "month" | "year" | "all";

function getPeriodRange(period: SummaryPeriod, allDates: string[]): { from: string; to: string; totalDaysInPeriod: number } {
  const today = endOfDay(new Date());
  let from: Date;
  if (period === "week") from = startOfWeek(today, { weekStartsOn: 1 });
  else if (period === "month") from = startOfMonth(today);
  else if (period === "year") from = startOfYear(today);
  else {
    const first = allDates.length
      ? new Date(`${allDates.slice().sort()[0]}T00:00:00`)
      : today;
    from = first;
  }

  const totalDaysInPeriod = Math.max(1, differenceInCalendarDays(today, from) + 1);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(today, "yyyy-MM-dd"),
    totalDaysInPeriod,
  };
}

function getPreviousRange(period: SummaryPeriod, currentFrom: string, currentTo: string): { from: string; to: string } | null {
  if (period === "all") return null;
  const from = new Date(`${currentFrom}T00:00:00`);
  const to = new Date(`${currentTo}T00:00:00`);
  const span = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const previousTo = subDays(from, 1);
  const previousFrom = subDays(previousTo, span - 1);
  return {
    from: format(previousFrom, "yyyy-MM-dd"),
    to: format(previousTo, "yyyy-MM-dd"),
  };
}

function computeStreaks(allDates: string[]) {
  const dates = new Set(allDates);
  const today = todayStr();
  let currentStreak = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }
  const sortedDates = Array.from(dates).sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sortedDates) {
    if (prev && addDays(prev, 1) === d) run++;
    else run = 1;
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }
  return { currentStreak, bestStreak, daysJournaled: dates.size };
}

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

router.get("/streak", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const [entries, totalEntries] = await Promise.all([
      prisma.entry.findMany({
        where: { userId, deletedAt: null },
        select: { date: true },
      }),
      prisma.entry.count({ where: { userId, deletedAt: null } }),
    ]);
    const dates = new Set(entries.map((e) => e.date));
    const today = todayStr();
    let currentStreak = 0;
    let cursor = dates.has(today) ? today : addDays(today, -1);
    while (dates.has(cursor)) {
      currentStreak++;
      cursor = addDays(cursor, -1);
    }
    const sortedDates = Array.from(dates).sort();
    let bestStreak = 0;
    let run = 0;
    let prev: string | null = null;
    for (const d of sortedDates) {
      if (prev && addDays(prev, 1) === d) {
        run++;
      } else {
        run = 1;
      }
      if (run > bestStreak) bestStreak = run;
      prev = d;
    }
    const stats: StreakStats = {
      currentStreak,
      bestStreak,
      daysJournaled: dates.size,
      totalEntries,
      activeToday: dates.has(today),
    };
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const period = ((req.query.period as string) || "month") as SummaryPeriod;
    if (!["week", "month", "year", "all"].includes(period)) {
      return res.status(400).json({ error: "Invalid period" });
    }

    const allEntries = await prisma.entry.findMany({
      where: { userId, deletedAt: null },
      select: {
        date: true,
        type: true,
        moodScore: true,
        durationSeconds: true,
        content: true,
      },
      orderBy: { date: "asc" },
    });

    const allDates = allEntries.map((e) => e.date);
    const { currentStreak, bestStreak } = computeStreaks(allDates);
    const { from, to, totalDaysInPeriod } = getPeriodRange(period, allDates);
    const previousRange = getPreviousRange(period, from, to);

    const currentEntries = allEntries.filter((e) => e.date >= from && e.date <= to);
    const previousEntries = previousRange
      ? allEntries.filter((e) => e.date >= previousRange.from && e.date <= previousRange.to)
      : [];

    const currentDates = new Set(currentEntries.map((e) => e.date));
    const totalDays = currentDates.size;
    const completionRate = Math.round((totalDays / totalDaysInPeriod) * 100);

    const entryBreakdown: EntryBreakdown = { audio: 0, video: 0, text: 0, total: 0 };
    let totalRecordedSec = 0;
    let totalWords = 0;

    for (const entry of currentEntries) {
      if (entry.type === "audio") entryBreakdown.audio++;
      else if (entry.type === "video") entryBreakdown.video++;
      else if (entry.type === "text") entryBreakdown.text++;
      entryBreakdown.total++;

      if ((entry.type === "audio" || entry.type === "video") && entry.durationSeconds) {
        totalRecordedSec += entry.durationSeconds;
      }

      if (entry.type === "text" && entry.content) {
        try {
          const plain = decryptString(entry.content);
          totalWords += plain.trim().split(/\s+/).filter(Boolean).length;
        } catch {
          // Ignore undecryptable historical content in summary math.
        }
      }
    }

    const currentMoodAvg = average(currentEntries.map((e) => e.moodScore));
    const previousMoodValues = previousEntries.map((e) => e.moodScore);
    const previousMoodAvg = previousMoodValues.length ? average(previousMoodValues) : 0;

    const byDayOfWeek = new Map<number, { count: number; moodSum: number; moodCount: number }>();
    for (const entry of currentEntries) {
      const day = getDay(new Date(`${entry.date}T12:00:00`));
      const current = byDayOfWeek.get(day) ?? { count: 0, moodSum: 0, moodCount: 0 };
      current.count += 1;
      current.moodSum += entry.moodScore;
      current.moodCount += 1;
      byDayOfWeek.set(day, current);
    }

    const moodByDayOfWeek = [...byDayOfWeek.entries()].map(([day, value]) => ({
      day,
      avg: value.moodCount ? value.moodSum / value.moodCount : 0,
      count: value.count,
    }));

    const moodCounts = new Map<number, number>();
    for (let i = 1; i <= 10; i++) moodCounts.set(i, 0);
    for (const entry of currentEntries) {
      moodCounts.set(entry.moodScore, (moodCounts.get(entry.moodScore) ?? 0) + 1);
    }
    const moodBreakdown = Array.from({ length: 10 }, (_, index) => {
      const value = index + 1;
      const count = moodCounts.get(value) ?? 0;
      return {
        value,
        count,
        percent: currentEntries.length ? Math.round((count / currentEntries.length) * 100) : 0,
      };
    });

    res.json({
      currentStreak,
      bestStreak,
      totalDays,
      completionRate,
      totalRecordedSec,
      totalWords,
      currentMoodAvg,
      previousMoodAvg,
      moodByDayOfWeek,
      entryBreakdown: {
        audio: entryBreakdown.audio,
        video: entryBreakdown.video,
        text: entryBreakdown.text,
      },
      moodBreakdown,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/breakdown", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const grouped = await prisma.entry.groupBy({
      by: ["type"],
      where: { userId, deletedAt: null },
      _count: { _all: true },
    });
    const breakdown: EntryBreakdown = { audio: 0, video: 0, text: 0, total: 0 };
    for (const row of grouped) {
      const count = row._count._all;
      if (row.type === "audio") breakdown.audio = count;
      else if (row.type === "video") breakdown.video = count;
      else if (row.type === "text") breakdown.text = count;
      breakdown.total += count;
    }
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
});

router.get("/heatmap", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const year = Number(req.query.year ?? new Date().getUTCFullYear());
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const entries = await prisma.entry.findMany({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
      select: { date: true, moodScore: true },
    });
    const byDate = new Map<string, number[]>();
    for (const e of entries) {
      const arr = byDate.get(e.date) ?? [];
      arr.push(e.moodScore);
      byDate.set(e.date, arr);
    }
    const cells: HeatmapCell[] = [];
    for (const [date, scores] of byDate) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const mood = moodFromScore(avg);
      cells.push({ date, count: scores.length, mood });
    }
    cells.sort((a, b) => a.date.localeCompare(b.date));
    res.json({ year, cells });
  } catch (err) {
    next(err);
  }
});

router.get("/on-this-day", async (req, res, next) => {
  try {
    const userId = req.userId!;
    const today = new Date();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const suffix = `-${mm}-${dd}`;
    const currentYear = today.getUTCFullYear();
    const entries = await prisma.entry.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { endsWith: suffix, lt: `${currentYear}-01-01` },
      },
      orderBy: { date: "desc" },
      take: 5,
    });
    res.json({
      items: entries.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        title: e.title,
        yearsAgo: currentYear - Number(e.date.slice(0, 4)),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
