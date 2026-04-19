import type { JournalEntry } from "@luminary/shared";
import { moodsByDateFromEntries } from "@luminary/shared";
import {
  addMonths,
  addYears,
  endOfMonth,
  format,
  isAfter,
  isSameMonth,
  parseISO,
  startOfMonth,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Mic, Plus, Search, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarNavArrow } from "@/components/calendar/CalendarNavArrow";
import { CalendarSearch } from "@/components/calendar/CalendarSearch";
import { CalendarView } from "@/components/calendar/CalendarView";
import { MonthYearPicker } from "@/components/calendar/MonthYearPicker";
import { DayPanel } from "@/components/entries/DayPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarMoodLineCard } from "@/components/mood/CalendarMoodLineCard";
import { Button } from "@/components/ui/button";
import { useEntriesRange } from "@/hooks/useEntries";
import { useEntrySearch } from "@/hooks/useEntrySearch";
import { useSwipe } from "@/hooks/useSwipe";
import { getDateRange, toIso, type StatsPeriod } from "@/lib/statsPeriod";
import { cn, todayIso } from "@/lib/utils";

function useIsLargeScreen() {
  const [isLarge, setIsLarge] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsLarge(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isLarge;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, q: string) {
  const t = q.trim();
  if (!t) return text;
  const re = new RegExp(`(${escapeRe(t)})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="search-result-mark">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const isLarge = useIsLargeScreen();

  const [month, setMonth] = useState(() => new Date());
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [navDir, setNavDir] = useState<0 | 1 | -1>(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const from = useMemo(() => format(startOfMonth(month), "yyyy-MM-dd"), [month]);
  const to = useMemo(() => format(endOfMonth(month), "yyyy-MM-dd"), [month]);

  const { data: entries = [], isPending: monthEntriesPending } = useEntriesRange(from, to);

  const chartRange = useMemo(() => getDateRange(period as StatsPeriod), [period]);
  const chartFrom = useMemo(() => toIso(chartRange.from), [chartRange.from]);
  const chartTo = useMemo(() => toIso(chartRange.to), [chartRange.to]);
  const {
    data: chartEntries = [],
    isLoading: chartEntriesLoading,
  } = useEntriesRange(chartFrom, chartTo);

  const { data: searchResults = [], debouncedQuery } = useEntrySearch(searchQuery);

  const moodsByDate = useMemo(() => moodsByDateFromEntries(entries), [entries]);

  const searchMatchDates = useMemo(() => {
    if (!debouncedQuery) return undefined;
    return new Set(searchResults.map((e) => e.date));
  }, [debouncedQuery, searchResults]);

  const today = new Date();
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const minMonth = useMemo(
    () => startOfMonth(addYears(new Date(today0.getFullYear(), today0.getMonth(), 1), -10)),
    [today0],
  );

  const canGoNext =
    !isSameMonth(month, today) &&
    !isAfter(startOfMonth(addMonths(month, 1)), today0);
  const canGoPrev = !isSameMonth(startOfMonth(month), minMonth);

  const bumpMonth = useCallback((delta: number) => {
    setNavDir(delta > 0 ? 1 : -1);
    setMonth((m) => addMonths(m, delta));
  }, []);

  const bumpYear = useCallback((delta: number) => {
    setNavDir(delta > 0 ? 1 : -1);
    setMonth((m) => addYears(m, delta));
  }, []);

  useEffect(() => {
    if (navDir === 0) return;
    const t = window.setTimeout(() => setNavDir(0), 220);
    return () => clearTimeout(t);
  }, [month, navDir]);

  const swipe = useSwipe(
    useCallback(() => bumpMonth(1), [bumpMonth]),
    useCallback(() => bumpMonth(-1), [bumpMonth]),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setMonth(new Date());
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) bumpYear(-1);
        else bumpMonth(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) bumpYear(1);
        else bumpMonth(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bumpMonth, bumpYear]);

  useEffect(() => {
    if (!isLarge || !selectedDate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedDate(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLarge, selectedDate]);

  function handleDayClick(iso: string) {
    if (isLarge) {
      setSelectedDate(iso);
    } else {
      navigate(`/app/day/${iso}`);
    }
  }

  function handleAddEntry() {
    if (isLarge) {
      setSelectedDate(todayIso());
    } else {
      navigate(`/app/day/${todayIso()}`);
    }
  }

  function goToSearchResult(entry: JournalEntry) {
    const d = parseISO(`${entry.date}T12:00:00`);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSearchQuery("");
    if (isLarge) {
      setSelectedDate(entry.date);
    } else {
      navigate(`/app/day/${entry.date}`);
    }
  }

  const showSearchPanel = searchQuery.trim().length > 0;

  return (
    <div className="main-content relative min-h-screen min-w-0 flex-1">
      <PageContainer>
        <header className="mb-0">
          <PageHeader
            title="My Journal"
            description="Your entries, moods, and memories — one day at a time."
            actions={
              <>
                <div className="relative w-full min-w-0 md:w-auto">
                  <CalendarSearch query={searchQuery} onChange={setSearchQuery} />

                {showSearchPanel && (
                  <div className="search-results-dropdown">
                    {!debouncedQuery ? (
                      <div className="px-4 py-6 text-center text-[13px] text-tertiary">
                        Typing…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-4 py-8 text-[13px] text-tertiary">
                        <Search className="h-8 w-8 opacity-40" strokeWidth={1.25} />
                        No entries found for &quot;{debouncedQuery}&quot;
                      </div>
                    ) : (
                      <>
                        <div className="search-results-header">
                          {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for
                          &quot;{debouncedQuery}&quot;
                        </div>
                        {searchResults.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            className="search-result-item w-full text-left"
                            onClick={() => goToSearchResult(e)}
                          >
                            <span
                              className={cn(
                                "search-result-icon",
                                e.type === "audio" && "bg-accent-subtle text-accent",
                                e.type === "video" && "bg-success-subtle text-success",
                                e.type === "text" && "bg-active text-secondary",
                              )}
                            >
                              {e.type === "audio" ? (
                                <Mic className="h-3.5 w-3.5" />
                              ) : e.type === "video" ? (
                                <Video className="h-3.5 w-3.5" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="search-result-title min-w-0">
                              {highlightMatch(e.title || `${e.type} entry`, debouncedQuery)}
                            </span>
                            <span className="search-result-date">
                              {format(parseISO(`${e.date}T12:00:00`), "MMM d, yyyy")}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                className="h-9 rounded-md px-4 text-[13px] font-semibold"
                onClick={handleAddEntry}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Add Entry
              </Button>
              </>
            }
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1">
              <CalendarNavArrow
                direction="prev"
                onClick={() => bumpMonth(-1)}
                disabled={!canGoPrev}
                label="Previous month"
              />
              <MonthYearPicker
                month={month}
                onMonthChange={setMonth}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
              />
              <CalendarNavArrow
                direction="next"
                onClick={() => bumpMonth(1)}
                disabled={!canGoNext}
                label="Next month"
              />
            </div>
            <button
              type="button"
              onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="h-8 rounded-full border border-border-default bg-surface px-4 text-[13px] font-medium text-secondary transition-colors hover:bg-hover hover:text-primary"
            >
              Today
            </button>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          {monthEntriesPending ? (
            <div className="calendar-skeleton" aria-busy aria-label="Loading calendar">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="skeleton-cell skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <CalendarView
              month={month}
              moodsByDate={moodsByDate}
              entries={entries}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              navDir={navDir}
              calendarSwipeHandlers={swipe}
              searchMatchDates={searchMatchDates}
            />
          )}

          <CalendarMoodLineCard
            entries={chartEntries}
            period={period}
            onPeriodChange={setPeriod}
            loading={chartEntriesLoading}
          />
        </div>
      </PageContainer>

      <AnimatePresence>
        {isLarge && selectedDate && (
          <>
            <motion.div
              key="backdrop"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[45] bg-black/25 backdrop-blur-[1px]"
              onClick={() => setSelectedDate(null)}
            />
            <motion.aside
              key={selectedDate}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%", transition: { duration: 0.18, ease: "easeIn" } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="day-panel fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[400px] flex-col border-l border-border-default bg-base shadow-lg"
            >
              <DayPanel
                date={selectedDate}
                variant="drawer"
                onClose={() => setSelectedDate(null)}
                isMobile={false}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
