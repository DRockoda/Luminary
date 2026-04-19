import type { HeatmapCell, MoodValue } from "@luminary/shared";
import { getMoodColor, getMoodEmoji } from "@luminary/shared";
import {
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { BarChart3, Calendar, CheckCircle2, Clock, Flame, Mic, PencilLine, Star, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarNavArrow } from "@/components/calendar/CalendarNavArrow";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/stats/AnimatedNumber";
import { ActivityHeatmapView, buildUtcYearHeatmapWeeks, HeatmapGrid } from "@/components/stats/HeatmapGrid";
import { MoodDistributionBars } from "@/components/stats/MoodDistributionBars";
import { QuoteCard } from "@/components/stats/QuoteCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEntriesRange } from "@/hooks/useEntries";
import { useHeatmap, useOnThisDay, useStatsSummary } from "@/hooks/useStats";
import { computeMoodDistribution, type StatsPeriod, toIso, getDateRange } from "@/lib/statsPeriod";

const LS_STATS_PERIOD = "luminary_stats_period";

function dateIsoInInclusiveRange(iso: string, rangeFrom: Date, rangeTo: Date): boolean {
  const d = parseISO(`${iso}T12:00:00`);
  return !isBefore(d, startOfDay(rangeFrom)) && !isAfter(d, endOfDay(rangeTo));
}

function dateIsoInSameCalendarMonth(iso: string, anchorMonth: Date): boolean {
  const d = parseISO(`${iso}T12:00:00`);
  return isSameMonth(d, anchorMonth);
}

function loadPeriod(): StatsPeriod {
  try {
    const v = localStorage.getItem(LS_STATS_PERIOD);
    if (v === "week" || v === "month" || v === "year" || v === "all") return v;
  } catch {
    /* ignore */
  }
  return "month";
}

export default function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>(loadPeriod);
  const [allTimeYear, setAllTimeYear] = useState(() => new Date().getFullYear());

  const { from, to } = useMemo(() => getDateRange(period), [period]);
  const fromIso = toIso(from);
  const toIsoStr = toIso(to);

  const { data: summary, isPending: summaryLoading } = useStatsSummary(period);
  const { data: onThisDay } = useOnThisDay();

  const { data: rangeEntries = [] } = useEntriesRange(fromIso, toIsoStr);

  const yearNow = new Date().getFullYear();
  const yearList = useMemo(
    () => Array.from({ length: yearNow - 2019 }, (_, i) => 2020 + i),
    [yearNow],
  );

  const needsCurrentYearHeatmap = period === "week" || period === "month" || period === "year";
  const { data: heatCurrentYear, isLoading: heatCurrentYearLoading } = useHeatmap(
    yearNow,
    needsCurrentYearHeatmap,
  );
  const { data: heatAllYear, isLoading: heatAllYearLoading } = useHeatmap(
    allTimeYear,
    period === "all" && yearList.length > 0,
  );

  const yearMin = yearList[0] ?? allTimeYear;
  const yearMax = yearList[yearList.length - 1] ?? allTimeYear;

  useEffect(() => {
    if (!yearList.length) return;
    if (allTimeYear < yearMin) setAllTimeYear(yearMin);
    else if (allTimeYear > yearMax) setAllTimeYear(yearMax);
  }, [yearList.length, allTimeYear, yearMin, yearMax]);

  const moodDistribution = useMemo(
    () => computeMoodDistribution(rangeEntries),
    [rangeEntries],
  );

  const monthAnchor = useMemo(() => startOfMonth(from), [from]);

  const heatCurrentYearCellMap = useMemo(() => {
    const cells = heatCurrentYear?.cells;
    const m = new Map<string, HeatmapCell>();
    if (cells) for (const c of cells) m.set(c.date, c);
    return m;
  }, [heatCurrentYear]);

  const activityWeekMonthHeatmapWeeks = useMemo(() => {
    if (period !== "week" && period !== "month") return null;
    const base = buildUtcYearHeatmapWeeks(yearNow);
    if (period === "week") {
      return base.map((week) =>
        week.map((d) => ({
          ...d,
          dimmed: d.dimmed || !dateIsoInInclusiveRange(d.iso, from, to),
        })),
      );
    }
    return base.map((week) =>
      week.map((d) => ({
        ...d,
        dimmed: d.dimmed || !dateIsoInSameCalendarMonth(d.iso, monthAnchor),
      })),
    );
  }, [period, yearNow, from, to, monthAnchor]);

  function setPeriodPersist(next: StatsPeriod) {
    setPeriod(next);
    try {
      localStorage.setItem(LS_STATS_PERIOD, next);
    } catch {
      /* ignore */
    }
  }

  const filterOptions: { id: StatsPeriod; label: string }[] = [
    { id: "week", label: "This week" },
    { id: "month", label: "This month" },
    { id: "year", label: "This year" },
    { id: "all", label: "All time" },
  ];

  const trend = useMemo(() => {
    const currentAvg = summary?.currentMoodAvg ?? 0;
    const previousAvg = summary?.previousMoodAvg ?? 0;
    if (!previousAvg) return "stable" as const;
    if (currentAvg > previousAvg) return "improving" as const;
    if (currentAvg < previousAvg) return "declining" as const;
    return "stable" as const;
  }, [summary?.currentMoodAvg, summary?.previousMoodAvg]);

  const trendConfig = {
    improving: { label: "↑ Getting better", color: "var(--success)" },
    declining: { label: "↓ Getting worse", color: "var(--danger)" },
    stable: { label: "→ About the same", color: "var(--text-secondary)" },
  } as const;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekGlance = useMemo(() => {
    const rows = summary?.moodByDayOfWeek ?? [];
    if (!rows.length) return null;
    const mostActive = rows.reduce((best, row) => (row.count > best.count ? row : best), rows[0]);
    const bestMood = rows.reduce((best, row) => (row.avg > best.avg ? row : best), rows[0]);
    const worstMood = rows.reduce((best, row) => (row.avg < best.avg ? row : best), rows[0]);
    return { mostActive, bestMood, worstMood };
  }, [summary?.moodByDayOfWeek]);

  const entryBreakdownRows = [
    {
      key: "audio",
      label: "Audio",
      icon: Mic,
      count: summary?.entryBreakdown.audio ?? 0,
      color: "var(--accent)",
    },
    {
      key: "video",
      label: "Video",
      icon: Video,
      count: summary?.entryBreakdown.video ?? 0,
      color: "var(--success)",
    },
    {
      key: "text",
      label: "Text",
      icon: PencilLine,
      count: summary?.entryBreakdown.text ?? 0,
      color: "var(--text-secondary)",
    },
  ];
  return (
    <div className="main-content min-w-0">
      <PageContainer className="min-w-0 space-y-6">
        <PageHeader
          title="Stats"
          description="Track your journaling habits, streaks, and mood over time."
          actions={
            <div className="filter-bar inline-flex gap-0.5 rounded-lg border border-border-default bg-surface p-1">
              {filterOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPeriodPersist(o.id)}
                  className={cn(
                    "rounded-md border border-transparent px-4 py-1.5 text-[13px] font-medium transition-all",
                    period === o.id
                      ? "border-border-strong bg-elevated text-primary shadow-sm"
                      : "text-secondary hover:text-primary",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          }
        />

        {rangeEntries.length === 0 && period !== "all" ? (
          <div className="empty-state rounded-lg border border-dashed border-border-default bg-surface">
            <BarChart3 className="h-10 w-10 text-tertiary" strokeWidth={1.25} />
            <div className="empty-state-title">No entries in this period</div>
            <p className="empty-state-body">Start journaling to see your stats here.</p>
          </div>
        ) : (
          <>
            {summaryLoading && !summary ? (
              <div className="stats-skeleton-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-stat-card skeleton-shimmer" />
                ))}
              </div>
            ) : (
            <section className="stats-summary-grid">
              <div className="stat-card stat-card--metric">
                <div className="stat-card-icon-wrap" aria-hidden>
                  <Flame className="h-[18px] w-[18px]" strokeWidth={1.85} style={{ color: "var(--accent)" }} />
                </div>
                <div className="stat-card-metric-body">
                  <div className="stat-card-value">
                    <AnimatedNumber value={summary?.currentStreak ?? 0} />
                  </div>
                  <p className="stat-card-caption">Current streak</p>
                </div>
              </div>
              <div className="stat-card stat-card--metric">
                <div className="stat-card-icon-wrap" aria-hidden>
                  <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={1.85} style={{ color: "var(--success)" }} />
                </div>
                <div className="stat-card-metric-body">
                  <div className="stat-card-value">
                    <AnimatedNumber value={summary?.completionRate ?? 0} />%
                  </div>
                  <p className="stat-card-caption">Completion rate</p>
                </div>
              </div>
              <div className="stat-card stat-card--metric">
                <div className="stat-card-icon-wrap" aria-hidden>
                  <Calendar className="h-[18px] w-[18px]" strokeWidth={1.85} style={{ color: "var(--accent)" }} />
                </div>
                <div className="stat-card-metric-body">
                  <div className="stat-card-value">
                    <AnimatedNumber value={summary?.totalDays ?? 0} />
                  </div>
                  <p className="stat-card-caption">Days journaled</p>
                </div>
              </div>
              <div className="stat-card stat-card--metric">
                <div className="stat-card-icon-wrap" aria-hidden>
                  <Star className="h-[18px] w-[18px]" strokeWidth={1.85} style={{ color: "var(--warning)" }} />
                </div>
                <div className="stat-card-metric-body">
                  <div className="stat-card-value">
                    <AnimatedNumber value={summary?.bestStreak ?? 0} />
                  </div>
                  <p className="stat-card-caption">Best streak</p>
                </div>
              </div>
              <div className="stat-card stat-card--metric">
                <div className="stat-card-icon-wrap" aria-hidden>
                  <Mic className="h-[18px] w-[18px]" strokeWidth={1.85} style={{ color: "var(--accent)" }} />
                </div>
                <div className="stat-card-metric-body">
                  <div className="stat-card-value">{formatRecorded(summary?.totalRecordedSec ?? 0)}</div>
                  <p className="stat-card-caption">Time recorded</p>
                </div>
              </div>
              <div className="stat-card stat-card--metric">
                <div className="stat-card-icon-wrap" aria-hidden>
                  <PencilLine className="h-[18px] w-[18px]" strokeWidth={1.85} style={{ color: "var(--accent)" }} />
                </div>
                <div className="stat-card-metric-body">
                  <div className="stat-card-value">
                    <AnimatedNumber value={summary?.totalWords ?? 0} />
                  </div>
                  <p className="stat-card-caption">Words written</p>
                </div>
              </div>
            </section>
            )}

            <section className="stats-card stats-card--mood-trend stats-card-full rounded-xl border border-border-subtle p-6">
              <div className="stats-card-header">
                <div>
                  <h3 className="stats-card-title">Mood Trend</h3>
                  <p className="stats-card-subtitle">How your average mood compares to the previous period</p>
                </div>
                <span className={cn("stats-trend-pill", `stats-trend-pill--${trend}`)}>{trendConfig[trend].label}</span>
              </div>
              <div className="mood-trend-rows">
                <div className="mood-trend-row">
                  <span className="mood-trend-label">Current</span>
                  <div className="mood-trend-bar-bg">
                    <div
                      className="mood-trend-bar-fill"
                      style={{ width: `${((summary?.currentMoodAvg ?? 0) / 10) * 100}%`, background: "var(--accent)" }}
                    />
                  </div>
                  <span className="mood-trend-value">{(summary?.currentMoodAvg ?? 0).toFixed(1)}</span>
                </div>
                {summary?.previousMoodAvg ? (
                  <div className="mood-trend-row">
                    <span className="mood-trend-label">Previous</span>
                    <div className="mood-trend-bar-bg">
                      <div
                        className="mood-trend-bar-fill"
                        style={{
                          width: `${((summary.previousMoodAvg ?? 0) / 10) * 100}%`,
                          background: "var(--border-strong)",
                        }}
                      />
                    </div>
                    <span className="mood-trend-value">{summary.previousMoodAvg.toFixed(1)}</span>
                  </div>
                ) : (
                  <p className="text-[12px] text-tertiary mt-3">No previous period data to compare yet.</p>
                )}
              </div>
            </section>

            <div className="stats-glance-breakdown-row">
              <section className="stats-card stats-glance-card h-full rounded-lg border border-border-subtle bg-surface p-6">
                <h3 className="stats-card-title">Your Week at a Glance</h3>
                {weekGlance ? (
                  <div className="week-glance-rows">
                    <div className="week-glance-row">
                      <span className="week-glance-label">Most active day</span>
                      <span className="week-glance-value">{dayNames[weekGlance.mostActive.day]}</span>
                    </div>
                    <div className="week-glance-row">
                      <span className="week-glance-label">Best mood day</span>
                      <span className="week-glance-value">
                        {dayNames[weekGlance.bestMood.day]}
                        <span
                          style={{
                            color: getMoodColor(Math.round(weekGlance.bestMood.avg) as MoodValue),
                            marginLeft: 8,
                          }}
                        >
                          {getMoodEmoji(Math.round(weekGlance.bestMood.avg) as MoodValue)}{" "}
                          {weekGlance.bestMood.avg.toFixed(1)}
                        </span>
                      </span>
                    </div>
                    <div className="week-glance-row">
                      <span className="week-glance-label">Lowest mood day</span>
                      <span className="week-glance-value">
                        {dayNames[weekGlance.worstMood.day]}
                        <span
                          style={{
                            color: getMoodColor(Math.round(weekGlance.worstMood.avg) as MoodValue),
                            marginLeft: 8,
                          }}
                        >
                          {getMoodEmoji(Math.round(weekGlance.worstMood.avg) as MoodValue)}{" "}
                          {weekGlance.worstMood.avg.toFixed(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] text-tertiary">Not enough entries in this period yet.</p>
                )}
              </section>

              <section className="stats-card stats-glance-card h-full rounded-lg border border-border-subtle bg-surface p-6">
                <div className="mb-4">
                  <div className="label-uppercase text-tertiary">Entry Breakdown</div>
                </div>
                <ul className="entry-breakdown-simple list-none space-y-3 p-0">
                  {entryBreakdownRows.map((row) => (
                    <li
                      key={row.key}
                      className="flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="flex min-w-0 items-center gap-2 font-medium text-primary">
                        <row.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} style={{ color: row.color }} />
                        {row.label}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-secondary">
                        {row.count} {row.count === 1 ? "entry" : "entries"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="stats-quote-row min-w-0">
              <QuoteCard />
            </div>

            <div className="stats-activity-row min-w-0 max-w-full">
              <section className="heatmap-card w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border-subtle bg-surface p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="label-uppercase text-tertiary">
                    Activity
                    {period === "week" && " · this week"}
                    {period === "month" && " · this month"}
                    {period === "year" && ` · ${yearNow}`}
                    {period === "all" && " · all time"}
                  </div>
                  {period === "all" && yearList.length > 0 && (
                    <div className="stats-activity-year-nav flex items-center gap-1.5">
                      <CalendarNavArrow
                        direction="prev"
                        onClick={() => setAllTimeYear((y) => Math.max(yearMin, y - 1))}
                        disabled={allTimeYear <= yearMin}
                        label="Previous year"
                      />
                      <span className="stats-activity-year-label min-w-[4.5ch] text-center font-mono text-[13px] tabular-nums">
                        {allTimeYear}
                      </span>
                      <CalendarNavArrow
                        direction="next"
                        onClick={() => setAllTimeYear((y) => Math.min(yearMax, y + 1))}
                        disabled={allTimeYear >= yearMax}
                        label="Next year"
                      />
                    </div>
                  )}
                </div>
                {(period === "week" || period === "month") &&
                  (heatCurrentYearLoading ? (
                    <div className="py-6 text-center text-[13px] text-tertiary">Loading…</div>
                  ) : activityWeekMonthHeatmapWeeks ? (
                    <ActivityHeatmapView weeks={activityWeekMonthHeatmapWeeks} cellsByDate={heatCurrentYearCellMap} />
                  ) : null)}
                {period === "year" &&
                  (heatCurrentYearLoading ? (
                    <div className="py-6 text-center text-[13px] text-tertiary">Loading…</div>
                  ) : heatCurrentYear ? (
                    <HeatmapGrid year={heatCurrentYear.year} cells={heatCurrentYear.cells} />
                  ) : (
                    <div className="py-6 text-center text-[13px] text-tertiary">No activity data for this year.</div>
                  ))}
                {period === "all" &&
                  (heatAllYearLoading ? (
                    <div className="py-6 text-center text-[13px] text-tertiary">Loading…</div>
                  ) : heatAllYear ? (
                    <HeatmapGrid year={heatAllYear.year} cells={heatAllYear.cells} />
                  ) : (
                    <div className="py-6 text-center text-[13px] text-tertiary">No activity data for this year.</div>
                  ))}
              </section>
            </div>

            <MoodDistributionBars distribution={moodDistribution} daysLogged={new Set(rangeEntries.map((e) => e.date)).size} />

            {onThisDay?.items && onThisDay.items.length > 0 && (
              <section
                className="section-gap rounded-lg border p-4"
                style={{
                  borderColor: "var(--accent-border)",
                  background: "var(--accent-subtle)",
                }}
              >
                <div className="label-uppercase mb-2 text-accent">On this day</div>
                <div className="space-y-2">
                  {onThisDay.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/day/${item.date}`}
                      className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-hover"
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium text-primary">
                          {item.yearsAgo} year{item.yearsAgo === 1 ? "" : "s"} ago —{" "}
                          <span className="text-secondary">{item.title || "Untitled entry"}</span>
                        </div>
                        <div className="font-mono text-[11px] text-tertiary">
                          {format(new Date(`${item.date}T12:00:00Z`), "MMMM d, yyyy")}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-accent">View</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
}

function formatRecorded(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
