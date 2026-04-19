import type { EntryBreakdown } from "@luminary/shared";
import { motion } from "framer-motion";
import { FileText, Mic, Video } from "lucide-react";

export function EntryTypeBreakdownCard({
  breakdown,
}: {
  breakdown: EntryBreakdown | undefined;
}) {
  const total = breakdown?.total ?? 0;
  const data = [
    {
      name: "Audio",
      value: breakdown?.audio ?? 0,
      color: "var(--accent)",
      icon: Mic,
      badge: "bg-accent-subtle text-accent",
    },
    {
      name: "Video",
      value: breakdown?.video ?? 0,
      color: "var(--success)",
      icon: Video,
      badge: "bg-success-subtle text-success",
    },
    {
      name: "Text",
      value: breakdown?.text ?? 0,
      color: "var(--text-secondary)",
      icon: FileText,
      badge: "bg-active text-secondary",
    },
  ];

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="label-uppercase text-tertiary">Entry types</div>
        <div className="text-sm text-secondary font-mono">{total} total</div>
      </div>
      <div className="space-y-3">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center gap-3">
              <span
                className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${d.badge}`}
              >
                <d.icon className="h-3 w-3" strokeWidth={1.75} />
              </span>
              <span className="text-base text-primary font-medium w-16">{d.name}</span>
              <div className="flex-1 h-1.5 bg-active rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: d.color }}
                />
              </div>
              <span className="text-sm text-secondary font-mono w-10 text-right tabular-nums">
                {d.value}
              </span>
              <span className="text-sm text-tertiary font-mono w-10 text-right tabular-nums">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
