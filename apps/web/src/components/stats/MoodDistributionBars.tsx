import { MOOD_SCALE, getMoodColor, type MoodValue } from "@luminary/shared";
import { motion } from "framer-motion";

export function MoodDistributionBars({
  distribution,
  daysLogged,
  loading,
}: {
  distribution: Record<MoodValue, number>;
  daysLogged: number;
  loading?: boolean;
}) {
  return (
    <div className="mood-breakdown-card rounded-lg border border-border-subtle bg-surface p-6">
      <div className="mb-4">
        <div className="label-uppercase text-tertiary">Mood</div>
        <div className="mt-1 text-[15px] font-semibold text-primary">
          {daysLogged > 0
            ? `${daysLogged} day${daysLogged === 1 ? "" : "s"} logged`
            : "No moods logged yet"}
        </div>
      </div>

      <div className="space-y-2.5">
        {MOOD_SCALE.map((mood) => {
          const pct = distribution[mood.value] ?? 0;
          return (
            <div key={mood.value} className="flex items-center gap-3">
              <span className="w-4 text-base leading-none" aria-hidden>
                {mood.emoji}
              </span>
              <span className="w-16 text-[13px] text-secondary">{mood.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-active">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getMoodColor(mood.value) }}
                />
              </div>
              <span className="w-10 text-right font-mono text-[13px] text-secondary">
                {loading ? "—" : `${Math.round(pct)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
