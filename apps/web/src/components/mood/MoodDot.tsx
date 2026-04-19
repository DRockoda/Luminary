import {
  MOOD_SCALE,
  type MoodValue,
  getMoodColor,
  getMoodLabel,
} from "@luminary/shared";
import { memo } from "react";
import { cn } from "@/lib/utils";

function MoodDotInner({
  mood,
  size = 8,
  className,
  withTooltip = false,
}: {
  mood: MoodValue;
  size?: number;
  className?: string;
  withTooltip?: boolean;
}) {
  return (
    <span
      aria-label={`Mood: ${getMoodLabel(mood)}`}
      title={withTooltip ? getMoodLabel(mood) : undefined}
      className={cn("inline-block rounded-full", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: getMoodColor(mood),
      }}
    />
  );
}

export const MoodDot = memo(MoodDotInner);

export function MoodLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {MOOD_SCALE.map((m) => (
        <div key={m.value} className="flex items-center gap-1.5 text-xs text-secondary">
          <MoodDot mood={m.value} size={8} />
          {m.label}
        </div>
      ))}
    </div>
  );
}
