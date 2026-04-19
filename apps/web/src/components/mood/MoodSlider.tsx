import type { MoodScore } from "@luminary/shared";
import { getMoodColor, getMoodEmoji, getMoodLabel } from "@luminary/shared";
import { useEffect, useRef, useState } from "react";

export function MoodSlider({
  value,
  onChange,
}: {
  value: MoodScore;
  onChange: (v: MoodScore) => void;
}) {
  const prevBump = useRef(value);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (prevBump.current !== value) {
      prevBump.current = value;
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 150);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="mood-slider-container">
      <p className="mood-slider-label">How are you feeling?</p>
      <div className="mood-slider-track">
        <span className="mood-emoji mood-emoji-left" aria-hidden>
          {getMoodEmoji(1)}
        </span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value) as MoodScore;
            if (v !== value && typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(8);
            }
            onChange(v);
          }}
          className={bump ? "mood-range-input mood-range-bump" : "mood-range-input"}
          style={
            {
              "--value": value,
              "--thumb-color": getMoodColor(value),
            } as React.CSSProperties
          }
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={value}
        />
        <span className="mood-emoji mood-emoji-right" aria-hidden>
          {getMoodEmoji(10)}
        </span>
      </div>
      <div
        className={bump ? "mood-current-label mood-current-label-bump" : "mood-current-label"}
        style={{ color: getMoodColor(value) }}
      >
        {getMoodEmoji(value)} {getMoodLabel(value)}
      </div>
    </div>
  );
}
