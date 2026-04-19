import type { HeatmapCell, JournalEntry, MoodValue } from "@luminary/shared";
import { dayMoodFromEntries, getMoodLabel } from "@luminary/shared";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function levelToColor(count: number): string {
  if (count <= 0) return "var(--heatmap-0)";
  if (count === 1) return "var(--heatmap-1)";
  if (count === 2) return "var(--heatmap-2)";
  return "var(--heatmap-3)";
}

export function MonthActivityGrid({
  anchorMonth,
  cells,
}: {
  anchorMonth: Date;
  cells: HeatmapCell[];
}) {
  const map = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    for (const c of cells) m.set(c.date, c);
    return m;
  }, [cells]);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchorMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(anchorMonth), { weekStartsOn: 1 });
    const out: Date[][] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      out.push(week);
    }
    return out;
  }, [anchorMonth]);

  const [tip, setTip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
    mood: MoodValue | null;
  } | null>(null);

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex w-full min-w-0 items-stretch gap-1">
        <div className="flex w-8 shrink-0 flex-col justify-between py-1 text-[10px] leading-tight text-tertiary">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex min-w-0 flex-1 flex-col gap-1">
              {week.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                const inMonth = isSameMonth(d, anchorMonth);
                const cell = map.get(iso);
                const count = cell?.count ?? 0;
                const mood = cell?.mood ?? null;
                return (
                  <div
                    key={iso}
                    onMouseEnter={(e) => {
                      const r = (e.target as HTMLElement).getBoundingClientRect();
                      setTip({ x: r.left, y: r.top, date: iso, count, mood });
                    }}
                    onMouseLeave={() => setTip(null)}
                    className={cn(
                      "aspect-square w-full max-w-full min-w-0 shrink-0 rounded-[2px] transition-colors",
                      !inMonth && "opacity-25",
                    )}
                    style={{ backgroundColor: levelToColor(count) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: tip.x, top: tip.y - 48 }}
        >
          <div className="font-mono text-tertiary">{tip.date}</div>
          <div className="text-primary">
            {tip.count} {tip.count === 1 ? "entry" : "entries"}
            {tip.mood && ` · ${getMoodLabel(tip.mood)}`}
          </div>
        </div>
      )}
    </div>
  );
}

export function cellsForMonth(anchor: Date, entries: JournalEntry[]) {
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  const days = eachDayOfInterval({ start, end });
  const byDate = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  return days.map((d) => {
    const iso = format(d, "yyyy-MM-dd");
    const list = byDate.get(iso) ?? [];
    return {
      date: iso,
      count: list.length,
      mood: dayMoodFromEntries(list),
    } satisfies HeatmapCell;
  });
}
