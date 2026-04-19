import type { MoodValue } from "@luminary/shared";
import { getMoodColor } from "@luminary/shared";
import { format } from "date-fns";
import { toIsoDate } from "@/lib/utils";

export function WeeklyActivity({
  days,
  entryDates,
  moodsByDate,
  title = "Activity strip",
}: {
  days: Date[];
  entryDates: Set<string>;
  moodsByDate: Record<string, MoodValue>;
  title?: string;
}) {
  const today = new Date();
  const journaled = days.filter((d) => entryDates.has(toIsoDate(d))).length;
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="label-uppercase text-tertiary">{title}</div>
        <div className="text-[13px] text-secondary">
          {journaled}/{days.length} day{journaled === 1 ? "" : "s"} journaled
        </div>
      </div>
      <div className="flex items-center justify-between gap-1.5">
        {days.map((d) => {
          const iso = toIsoDate(d);
          const isPast = d <= today;
          const mood = moodsByDate[iso];
          const has = entryDates.has(iso);
          const bg =
            has && mood
              ? getMoodColor(mood)
              : has
                ? "var(--accent)"
                : "var(--bg-active)";
          return (
            <div key={iso} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="text-xs font-medium uppercase text-tertiary">
                {format(d, "EEEEE")}
              </div>
              <div
                className="aspect-square w-full rounded-md border border-border-subtle"
                style={{
                  backgroundColor: bg,
                  opacity: has ? 0.95 : isPast ? 1 : 0.4,
                }}
                title={iso}
              />
              <div className="font-mono text-xs text-tertiary">{format(d, "d")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
