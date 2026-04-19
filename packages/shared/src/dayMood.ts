import { moodFromScore, type MoodValue } from "./mood";
import type { JournalEntry } from "./types";

/** Rounded average of entry mood scores (1–10) for one day. */
export function dayMoodFromEntries(entries: Pick<JournalEntry, "mood">[]): MoodValue | null {
  if (!entries.length) return null;
  const avg =
    entries.reduce((s, e) => s + (e.mood ?? 5), 0) / entries.length;
  return moodFromScore(Math.round(avg));
}

/** One mood per calendar day that has at least one entry (from averaged entry moods). */
export function moodsByDateFromEntries(entries: JournalEntry[]): Record<string, MoodValue> {
  const by = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const arr = by.get(e.date) ?? [];
    arr.push(e);
    by.set(e.date, arr);
  }
  const out: Record<string, MoodValue> = {};
  for (const [date, list] of by) {
    const m = dayMoodFromEntries(list);
    if (m) out[date] = m;
  }
  return out;
}
