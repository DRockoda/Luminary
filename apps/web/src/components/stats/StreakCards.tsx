import type { StreakStats } from "@luminary/shared";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, FileText, Flame, Star } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function StreakCards({
  stats,
  daysJournaledOverride,
  totalEntriesOverride,
}: {
  stats: StreakStats | undefined;
  daysJournaledOverride?: number;
  totalEntriesOverride?: number;
}) {
  const items = [
    {
      value: stats?.currentStreak ?? 0,
      label: "Current streak",
      icon: Flame,
      accent: stats?.activeToday,
    },
    { value: stats?.bestStreak ?? 0, label: "Best streak", icon: Star },
    {
      value: daysJournaledOverride ?? stats?.daysJournaled ?? 0,
      label: "Days journaled",
      icon: Calendar,
    },
    {
      value: totalEntriesOverride ?? stats?.totalEntries ?? 0,
      label: "Total entries",
      icon: FileText,
    },
  ];
  return (
    <div className="stats-grid grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25 }}
          className="stat-card relative rounded-lg border border-border-subtle bg-surface p-5"
        >
          <item.icon
            className={cn(
              "h-4 w-4 mb-2",
              item.accent ? "text-accent" : "text-tertiary",
            )}
            strokeWidth={1.75}
          />
          <div
            className={cn(
              "stat-number mt-2 text-[32px] font-light tabular-nums tracking-tight",
              item.accent ? "text-accent" : "text-primary",
            )}
          >
            <Counter value={item.value} />
          </div>
          <div className="mt-1 text-[13px] text-secondary">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

function Counter({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 22, stiffness: 110 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  return <motion.span>{display}</motion.span>;
}
