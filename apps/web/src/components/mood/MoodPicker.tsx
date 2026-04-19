import { MOOD_TAGS, type MoodTag } from "@luminary/shared";
import { motion } from "framer-motion";
import { cn, triggerHaptic } from "@/lib/utils";

const TAG_META: Record<MoodTag, { label: string; emoji: string; color: string }> = {
  bad: { label: "Bad", emoji: "😞", color: "#F97316" },
  low: { label: "Low", emoji: "😕", color: "#FB923C" },
  okay: { label: "Okay", emoji: "😐", color: "#A3A3A3" },
  good: { label: "Good", emoji: "😊", color: "#22C55E" },
  great: { label: "Great", emoji: "😄", color: "#10B981" },
};

export function MoodPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: MoodTag | null;
  onChange: (mood: MoodTag) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MOOD_TAGS.map((m) => {
        const meta = TAG_META[m];
        const active = value === m;
        return (
          <motion.button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => {
              triggerHaptic(8);
              onChange(m);
            }}
            whileTap={{ scale: 0.96 }}
            animate={active ? { scale: 1.04 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
              "relative flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-md border px-2 py-2.5 transition-colors",
              active
                ? "text-primary"
                : "bg-surface border-border-subtle hover:bg-hover text-secondary",
              disabled && "opacity-60 cursor-not-allowed",
            )}
            style={
              active
                ? {
                    borderColor: meta.color,
                    backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                  }
                : undefined
            }
            aria-pressed={active}
            aria-label={`${meta.label} mood`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {meta.emoji}
            </span>
            <span className="text-xs font-medium">{meta.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
