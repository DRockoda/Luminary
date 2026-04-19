import type { EntryBreakdown, JournalEntry, MoodValue } from "@luminary/shared";
import { MOOD_SCALE, dayMoodFromEntries, getMoodLabel } from "@luminary/shared";
import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  max as dfMax,
  min as dfMin,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";

export type StatsPeriod = "week" | "month" | "year" | "all";

const ALL_FROM = new Date("2020-01-01T00:00:00");

export function getDateRange(period: StatsPeriod): { from: Date; to: Date } {
  const today = endOfDay(new Date());
  switch (period) {
    case "week":
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: today,
      };
    case "month":
      return { from: startOfMonth(today), to: today };
    case "year":
      return { from: startOfYear(today), to: today };
    case "all":
    default:
      return { from: ALL_FROM, to: today };
  }
}

export function toIso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function computeBreakdown(entries: JournalEntry[]): EntryBreakdown {
  const b: EntryBreakdown = { audio: 0, video: 0, text: 0, total: 0 };
  for (const e of entries) {
    b[e.type]++;
    b.total++;
  }
  return b;
}

export function computeDaysJournaled(entries: JournalEntry[]): number {
  return new Set(entries.map((e) => e.date)).size;
}

export function computeMoodDistribution(
  entries: JournalEntry[],
): Record<MoodValue, number> {
  const byDate = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  const dayMoods: MoodValue[] = [];
  for (const list of byDate.values()) {
    const m = dayMoodFromEntries(list);
    if (m) dayMoods.push(m);
  }
  const counts: Record<string, number> = {};
  for (const m of MOOD_SCALE) counts[m.value] = 0;
  for (const m of dayMoods) counts[m] = (counts[m] ?? 0) + 1;
  const total = dayMoods.length || 1;
  const pct: Record<MoodValue, number> = {} as Record<MoodValue, number>;
  for (const m of MOOD_SCALE) {
    pct[m.value] = (counts[m.value] / total) * 100;
  }
  return pct;
}

export interface MoodChartPoint {
  x: string;
  score: number;
  label: string;
}

export function buildMoodChartSeries(
  period: StatsPeriod,
  entries: JournalEntry[],
  from: Date,
  to: Date,
): MoodChartPoint[] {
  const byDate = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const d = parseISO(`${e.date}T12:00:00`);
    if (!isWithinInterval(d, { start: startOfDay(from), end: endOfDay(to) })) continue;
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  const inRange: { date: string; mood: MoodValue }[] = [];
  for (const [date, list] of byDate) {
    const mood = dayMoodFromEntries(list);
    if (mood) inRange.push({ date, mood });
  }

  if (period === "week" || period === "month") {
    return inRange
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        x: l.date,
        score: l.mood,
        label: getMoodLabel(l.mood),
      }));
  }

  if (period === "year") {
    const byWeek = new Map<string, { sum: number; n: number }>();
    for (const l of inRange) {
      const d = parseISO(`${l.date}T12:00:00`);
      const wk = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const sc = l.mood;
      const cur = byWeek.get(wk) ?? { sum: 0, n: 0 };
      cur.sum += sc;
      cur.n += 1;
      byWeek.set(wk, cur);
    }
    return [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, v]) => ({
        x: wk,
        score: v.sum / v.n,
        label: "Avg mood",
      }));
  }

  const byMonth = new Map<string, { sum: number; n: number }>();
  for (const l of inRange) {
    const d = parseISO(`${l.date}T12:00:00`);
    const mk = format(d, "yyyy-MM");
    const sc = l.mood;
    const cur = byMonth.get(mk) ?? { sum: 0, n: 0 };
    cur.sum += sc;
    cur.n += 1;
    byMonth.set(mk, cur);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mk, v]) => ({
      x: `${mk}-01`,
      score: v.sum / v.n,
      label: "Avg mood",
    }));
}

export function buildStripBars(
  days: Date[],
  entries: { date: string }[],
  moodsByDate: Record<string, MoodValue | undefined>,
): { label: string; iso: string; count: number; mood?: MoodValue | null }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.date, (counts.get(e.date) ?? 0) + 1);
  }
  return days.map((d) => {
    const iso = toIso(d);
    return {
      label: format(d, "EEE"),
      iso,
      count: counts.get(iso) ?? 0,
      mood: moodsByDate[iso] ?? null,
    };
  });
}

export function last7DaysInRange(from: Date, to: Date): Date[] {
  const end = dfMin([endOfDay(to), endOfDay(new Date())]);
  const start = dfMax([startOfDay(from), subDays(end, 6)]);
  return eachDayOfInterval({ start, end });
}

/** Up to 7 days starting at period `from` (capped by `to`). */
export function activityStripDays(period: StatsPeriod): Date[] {
  const { from, to } = getDateRange(period);
  const endCap = dfMin([endOfDay(to), endOfDay(addDays(startOfDay(from), 6))]);
  return eachDayOfInterval({ start: startOfDay(from), end: endCap });
}

export type ActivityHeatmapDay = { iso: string; dimmed?: boolean };
