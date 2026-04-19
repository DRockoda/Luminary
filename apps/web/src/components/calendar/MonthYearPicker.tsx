import { format, isAfter } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthYearPicker({
  month,
  onMonthChange,
  open,
  onOpenChange,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const today = new Date();
  const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const minYear = today.getFullYear() - 10;
  const maxYear = today.getFullYear();

  const [year, setYear] = useState(() => month.getFullYear());
  const [focusMonth, setFocusMonth] = useState(() => month.getMonth());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setYear(month.getFullYear());
      setFocusMonth(month.getMonth());
      requestAnimationFrame(() => panelRef.current?.focus());
    }
  }, [open, month]);

  function isFutureMonth(mIdx: number, y: number) {
    const candidate = new Date(y, mIdx, 1);
    return isAfter(candidate, todayMonthStart);
  }

  function selectMonth(mIdx: number) {
    if (isFutureMonth(mIdx, year)) return;
    onMonthChange(new Date(year, mIdx, 1));
    onOpenChange(false);
  }

  const canIncYear = year < maxYear;
  const canDecYear = year > minYear;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusMonth((m) => (m + 11) % 12);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusMonth((m) => (m + 1) % 12);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (canDecYear) {
        setYear((y) => y - 1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (canIncYear) {
        setYear((y) => y + 1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectMonth(focusMonth);
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 border-0 bg-transparent p-0 text-[15px] font-semibold text-primary outline-none hover:opacity-90"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-secondary" strokeWidth={1.75} />
          {format(month, "MMMM, yyyy")}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-tertiary" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={panelRef}
        className="month-picker-popover w-[280px] border border-border-strong bg-elevated p-4 shadow-lg outline-none"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(ev) => {
          ev.preventDefault();
          panelRef.current?.focus();
        }}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <div className="year-nav mb-3.5 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous year"
            className="year-arrow"
            disabled={!canDecYear}
            onClick={() => canDecYear && setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="year-label">{year}</span>
          <button
            type="button"
            aria-label="Next year"
            className="year-arrow"
            disabled={!canIncYear}
            onClick={() => canIncYear && setYear((y) => y + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="month-grid">
          {MONTHS.map((label, mIdx) => {
            const future = isFutureMonth(mIdx, year);
            const isCalMonth = month.getFullYear() === year && month.getMonth() === mIdx;
            const isTodayMonth =
              today.getFullYear() === year && today.getMonth() === mIdx;
            const keyboardFocus = open && focusMonth === mIdx;
            return (
              <button
                key={label}
                type="button"
                disabled={future}
                onMouseEnter={() => setFocusMonth(mIdx)}
                onClick={() => selectMonth(mIdx)}
                className={cn(
                  "month-btn",
                  isTodayMonth && "is-current",
                  isCalMonth && !isTodayMonth && "is-selected",
                  keyboardFocus && "ring-1 ring-accent-border",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
