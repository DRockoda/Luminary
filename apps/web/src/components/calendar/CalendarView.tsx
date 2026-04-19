import type { JournalEntry, MoodValue } from "@luminary/shared";
import type { TouchEvent } from "react";
import {
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { EntryMiniCard } from "@/components/calendar/EntryMiniCard";
import { MoodDot } from "@/components/mood/MoodDot";
import { cn, toIsoDate } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({
  month,
  entries,
  moodsByDate,
  selectedDate,
  onDayClick,
  navDir = 0,
  calendarSwipeHandlers,
  searchMatchDates,
}: {
  month: Date;
  entries: JournalEntry[];
  moodsByDate: Record<string, MoodValue>;
  selectedDate?: string | null;
  onDayClick: (iso: string) => void;
  navDir?: 0 | 1 | -1;
  calendarSwipeHandlers?: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
  };
  searchMatchDates?: Set<string>;
}) {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const result: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [month]);

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.date);
      if (arr) arr.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [entries]);

  return (
    <div className="calendar-grid w-full overflow-hidden rounded-xl border border-border-default bg-surface">
      <div className="calendar-dow-header grid grid-cols-7 border-b border-border-default bg-surface">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-dow-cell">
            {w}
          </div>
        ))}
      </div>

      <motion.div
        key={format(month, "yyyy-MM")}
        initial={{ opacity: 0, x: navDir * 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        {...calendarSwipeHandlers}
        className="touch-pan-y"
      >
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className={cn(
              "calendar-week-row grid grid-cols-7 border-b border-border-subtle",
              wi === weeks.length - 1 && "last-week-row",
            )}
          >
            {week.map((d) => {
              const iso = toIsoDate(d);
              const inMonth = isSameMonth(d, month);
              const isTodayCell = iso === todayIso;
              const isFuture = isAfter(d, today0);
              const isSelected = selectedDate === iso;
              const mood = moodsByDate[iso];
              const dayEntries = entriesByDate.get(iso) ?? [];
              const isOverflow = !inMonth;
              const searchHit = searchMatchDates?.has(iso) ?? false;

              return (
                <motion.div
                  key={iso}
                  tabIndex={isFuture ? -1 : 0}
                  onClick={() => {
                    if (!isFuture) onDayClick(iso);
                  }}
                  onKeyDown={(e) => {
                    if (isFuture) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onDayClick(iso);
                    }
                  }}
                  whileHover={isFuture ? undefined : { scale: 1.01 }}
                  whileTap={isFuture ? undefined : { scale: 0.99 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "calendar-day-cell",
                    !isFuture && "is-interactive",
                    isFuture && "is-future",
                    isOverflow && "is-overflow",
                    isTodayCell && "is-today",
                    isSelected && "is-selected",
                    searchHit && "is-search-hit",
                  )}
                >
                  <div className="day-number-wrap mb-2">
                    {isTodayCell ? (
                      <span className="day-number-circle">{d.getDate()}</span>
                    ) : (
                      <span className="day-number">{d.getDate()}</span>
                    )}
                    {mood && (
                      <span className="calendar-cell-mood-dot md:hidden">
                        <MoodDot mood={mood} size={6} />
                      </span>
                    )}
                  </div>

                  {!isFuture && (
                    <div className="entry-mini-stack">
                      {dayEntries.slice(0, 2).map((e) => (
                        <EntryMiniCard
                          key={e.id}
                          entry={e}
                          onOpenDay={() => onDayClick(iso)}
                        />
                      ))}
                      {dayEntries.length > 2 && (
                        <div className="entry-overflow-badge">
                          + {dayEntries.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {mood && (
                    <span className="calendar-mood-corner hidden md:block">
                      <MoodDot mood={mood} size={8} />
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
