import { MOODS, MOOD_META, type MoodSummary } from "@luminary/shared";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PERIODS: MoodSummary["period"][] = ["week", "month", "year"];

export function MoodSummaryCard({
  summary,
  period,
  onPeriodChange,
  loading,
}: {
  summary: MoodSummary | null;
  period: MoodSummary["period"];
  onPeriodChange: (p: MoodSummary["period"]) => void;
  loading?: boolean;
}) {
  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-tertiary uppercase tracking-[0.06em]">
            Mood
          </div>
          <div className="text-md text-primary font-semibold mt-0.5">
            {summary?.daysLogged
              ? `${summary.daysLogged} day${summary.daysLogged === 1 ? "" : "s"} logged`
              : "No moods logged yet"}
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-hover rounded-md p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "px-2.5 h-6 rounded text-xs font-medium capitalize transition-colors",
                period === p
                  ? "bg-elevated text-primary shadow-sm"
                  : "text-secondary hover:text-primary",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {MOODS.map((m) => {
          const meta = MOOD_META[m];
          const pct = summary?.distribution[m] ?? 0;
          return (
            <div key={m} className="flex items-center gap-3">
              <span className="text-base leading-none w-4" aria-hidden>
                {meta.emoji}
              </span>
              <span className="w-12 text-sm text-secondary">{meta.label}</span>
              <div className="flex-1 h-1.5 bg-active rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
              </div>
              <span className="w-10 text-right text-sm text-secondary font-mono">
                {loading ? "—" : `${Math.round(pct)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
