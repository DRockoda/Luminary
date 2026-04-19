import { ArrowLeft, ArrowRight } from "lucide-react";

interface CalendarNavArrowProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  label: string;
}

export function CalendarNavArrow({
  direction,
  onClick,
  disabled,
  label,
}: CalendarNavArrowProps) {
  return (
    <button
      type="button"
      className="cal-nav-arrow"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {direction === "prev" ? (
        <ArrowLeft size={15} strokeWidth={1.75} />
      ) : (
        <ArrowRight size={15} strokeWidth={1.75} />
      )}
    </button>
  );
}

