import type { JournalEntry } from "@luminary/shared";
import { dayMoodFromEntries } from "@luminary/shared";
import { useMemo } from "react";
import { MoodChart } from "@/components/stats/MoodChart";
import {
  buildMoodChartSeries,
  getDateRange,
  type StatsPeriod,
} from "@/lib/statsPeriod";
import { cn } from "@/lib/utils";

const PERIODS: Array<"week" | "month" | "year"> = ["week", "month", "year"];

export function CalendarMoodLineCard({
  entries,
  period,
  onPeriodChange,
  loading,
}: {
  entries: JournalEntry[];
  period: "week" | "month" | "year";
  onPeriodChange: (p: "week" | "month" | "year") => void;
  loading?: boolean;
}) {
  const p = period as StatsPeriod;
  const { from, to } = useMemo(() => getDateRange(p), [p]);
  const chartData = useMemo(
    () => buildMoodChartSeries(p, entries, from, to),
    [p, entries, from, to],
  );

  const daysWithMood = useMemo(() => {
    const byDate = new Map<string, JournalEntry[]>();
    for (const e of entries) {
      const arr = byDate.get(e.date) ?? [];
      arr.push(e);
      byDate.set(e.date, arr);
    }
    let n = 0;
    for (const list of byDate.values()) {
      if (dayMoodFromEntries(list)) n++;
    }
    return n;
  }, [entries]);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.06em] text-tertiary">
            Mood
          </div>
          <div className="text-md mt-0.5 font-semibold text-primary">
            {daysWithMood > 0
              ? `${daysWithMood} day${daysWithMood === 1 ? "" : "s"} logged`
              : "No moods logged yet"}
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-md bg-hover p-0.5">
          {PERIODS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onPeriodChange(opt)}
              className={cn(
                "h-6 rounded px-2.5 text-xs font-medium capitalize transition-colors",
                period === opt
                  ? "bg-elevated text-primary shadow-sm"
                  : "text-secondary hover:text-primary",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-[13px] text-tertiary">
          Loading…
        </div>
      ) : (
        <MoodChart data={chartData} showTitle={false} embedded />
      )}
    </div>
  );
}
