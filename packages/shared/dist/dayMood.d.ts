import { type MoodValue } from "./mood.js";
import type { JournalEntry } from "./types.js";
/** Rounded average of entry mood scores (1–10) for one day. */
export declare function dayMoodFromEntries(entries: Pick<JournalEntry, "mood">[]): MoodValue | null;
/** One mood per calendar day that has at least one entry (from averaged entry moods). */
export declare function moodsByDateFromEntries(entries: JournalEntry[]): Record<string, MoodValue>;
