import type { HeatmapCell, MoodValue } from "@luminary/shared";
import { getMoodLabel } from "@luminary/shared";
import { useMemo, useState } from "react";
import type { ActivityHeatmapDay } from "@/lib/statsPeriod";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_TOOLTIP: Record<(typeof MONTHS)[number], string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

function buildYearWeeks(year: number): Array<Array<{ iso: string; inYear: boolean }>> {
  const start = new Date(Date.UTC(year, 0, 1));
  const firstDow = start.getUTCDay();
  const gridStart = new Date(start);
  gridStart.setUTCDate(gridStart.getUTCDate() - firstDow);
  const end = new Date(Date.UTC(year, 11, 31));
  const out: Array<Array<{ iso: string; inYear: boolean }>> = [];
  const cursor = new Date(gridStart);
  while (cursor <= end) {
    const week: Array<{ iso: string; inYear: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const iso = cursor.toISOString().slice(0, 10);
      week.push({ iso, inYear: cursor.getUTCFullYear() === year });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    out.push(week);
  }
  return out;
}

/** Full GitHub-style year grid (UTC), with padding weeks dimmed via `dimmed`. */
export function buildUtcYearHeatmapWeeks(year: number): ActivityHeatmapDay[][] {
  return buildYearWeeks(year).map((w) => w.map((d) => ({ iso: d.iso, dimmed: !d.inYear })));
}

function levelToColor(count: number): string {
  if (count <= 0) return "var(--heatmap-0)";
  if (count === 1) return "var(--heatmap-1)";
  if (count === 2) return "var(--heatmap-2)";
  return "var(--heatmap-3)";
}

export function ActivityHeatmapView({
  weeks,
  cellsByDate,
}: {
  weeks: ActivityHeatmapDay[][];
  cellsByDate: Map<string, HeatmapCell>;
}) {
  const monthLabels = useMemo(() => {
    const result: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const mon = week[0];
      if (!mon) return;
      const month = Number(mon.iso.slice(5, 7)) - 1;
      if (month < 0 || month > 11 || Number.isNaN(month)) return;
      if (month !== lastMonth) {
        result.push({ col, label: MONTHS[month] ?? "" });
        lastMonth = month;
      }
    });
    return result;
  }, [weeks]);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
    mood: MoodValue | null;
  } | null>(null);

  return (
    <div className="heatmap-fluid relative w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible pb-2">
      <div className="activity-heatmap-month-row mb-1 flex w-full min-w-0 gap-[3px]">
        <div className="w-6 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 gap-[3px]">
          {weeks.map((_, col) => {
            const label = monthLabels.find((m) => m.col === col);
            return (
              <div
                key={col}
                className="flex min-h-[14px] min-w-0 flex-1 items-end justify-center overflow-visible"
              >
                {label?.label ? (
                  <span
                    className="activity-heatmap-month-label"
                    title={MONTH_TOOLTIP[label.label as keyof typeof MONTH_TOOLTIP]}
                  >
                    {label.label}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex w-full min-w-0 items-stretch gap-[3px]">
        <div className="flex w-6 shrink-0 flex-col justify-between py-1 pr-1 text-[10px] leading-tight text-tertiary">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex min-w-0 flex-1 flex-col gap-[3px]">
              {week.map((d) => {
                const cell = cellsByDate.get(d.iso) ?? { date: d.iso, count: 0, mood: null };
                const count = cell.count;
                const mood = cell.mood ?? null;
                return (
                  <div
                    key={d.iso}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        x: rect.left,
                        y: rect.top,
                        date: d.iso,
                        count,
                        mood,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className={cn(
                      "aspect-square w-full max-w-full min-w-0 shrink-0 rounded-[2px] transition-colors",
                      d.dimmed && "opacity-30",
                    )}
                    style={{
                      backgroundColor: levelToColor(count),
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: tooltip.x, top: tooltip.y - 50 }}
        >
          <div className="font-mono text-tertiary">{tooltip.date}</div>
          <div className="text-primary">
            {tooltip.count} {tooltip.count === 1 ? "entry" : "entries"}
            {tooltip.mood && ` · ${getMoodLabel(tooltip.mood)}`}
          </div>
        </div>
      )}
    </div>
  );
}

export function HeatmapGrid({
  year,
  cells,
}: {
  year: number;
  cells: HeatmapCell[];
}) {
  const cellsByDate = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    for (const c of cells) m.set(c.date, c);
    return m;
  }, [cells]);

  const weeks = useMemo(() => {
    const raw = buildYearWeeks(year);
    return raw.map((w) => w.map((d) => ({ iso: d.iso, dimmed: !d.inYear })));
  }, [year]);

  return <ActivityHeatmapView weeks={weeks} cellsByDate={cellsByDate} />;
}
