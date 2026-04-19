import type { Mood } from "@luminary/shared";
import { addDays, format, startOfWeek } from "date-fns";
import { MoodDot } from "@/components/mood/MoodDot";
import { cn, toIsoDate } from "@/lib/utils";

export function WeekStrip({ moodsByDate }: { moodsByDate: Record<string, Mood> }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="flex items-stretch justify-between gap-1">
      {days.map((d) => {
        const iso = toIsoDate(d);
        const mood = moodsByDate[iso];
        const isToday = iso === toIsoDate(today);
        return (
          <div
            key={iso}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-2 rounded-md",
              isToday ? "bg-accent-subtle" : "bg-transparent",
            )}
          >
            <div
              className={cn(
                "text-xs font-medium uppercase tracking-[0.06em]",
                isToday ? "text-accent" : "text-tertiary",
              )}
            >
              {format(d, "EEEEE")}
            </div>
            <div className={cn("text-sm", isToday ? "text-accent font-semibold" : "text-secondary")}>
              {d.getDate()}
            </div>
            <div className="h-2 flex items-center justify-center">
              {mood ? (
                <MoodDot mood={mood} size={8} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-border-default" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
