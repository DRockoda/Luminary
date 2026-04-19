import type { MoodValue } from "@luminary/shared";
import { getMoodColor, getMoodLabel } from "@luminary/shared";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function WeekActivityBars({
  days,
}: {
  days: { label: string; iso: string; count: number; mood?: MoodValue | null }[];
}) {
  const max = useMemo(
    () => Math.max(1, ...(days.length ? days.map((d) => d.count) : [0])),
    [days],
  );
  const [tip, setTip] = useState<{
    iso: string;
    count: number;
    mood?: MoodValue | null;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative pb-1">
      <div className="flex h-36 items-end justify-between gap-1.5">
        {days.map((d) => {
          const h = Math.round((d.count / max) * 100);
          const bg =
            d.count === 0
              ? "var(--bg-active)"
              : d.mood
                ? getMoodColor(d.mood)
                : "var(--accent)";
          return (
            <div key={d.iso} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <button
                type="button"
                className="relative flex h-28 w-full max-w-[48px] items-end justify-center rounded-md border border-border-subtle bg-active"
                onMouseEnter={(e) => {
                  const r = (e.target as HTMLElement).getBoundingClientRect();
                  setTip({
                    iso: d.iso,
                    count: d.count,
                    mood: d.mood,
                    x: r.left,
                    y: r.top,
                  });
                }}
                onMouseLeave={() => setTip(null)}
              >
                <div
                  className={cn("w-full rounded-sm transition-all")}
                  style={{
                    height: `${h}%`,
                    minHeight: d.count > 0 ? 4 : 0,
                    backgroundColor: bg,
                  }}
                />
              </button>
              <span className="text-[10px] font-medium text-tertiary">{d.label}</span>
            </div>
          );
        })}
      </div>
      {tip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: tip.x, top: tip.y - 44 }}
        >
          <div className="font-mono text-tertiary">{tip.iso}</div>
          <div className="text-primary">
            {tip.count} {tip.count === 1 ? "entry" : "entries"}
            {tip.mood && ` · ${getMoodLabel(tip.mood)}`}
          </div>
        </div>
      )}
    </div>
  );
}
