import type { EntryBreakdown, HeatmapCell, StreakStats } from "@luminary/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StatsPeriod } from "@/lib/statsPeriod";

export function useStreak() {
  return useQuery<StreakStats>({
    queryKey: ["stats", "streak"],
    queryFn: async () => (await api.get<StreakStats>("/api/stats/streak")).data,
  });
}

export function useBreakdown() {
  return useQuery<EntryBreakdown>({
    queryKey: ["stats", "breakdown"],
    queryFn: async () => (await api.get<EntryBreakdown>("/api/stats/breakdown")).data,
  });
}

export interface StatsSummary {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  completionRate: number;
  totalRecordedSec: number;
  totalWords: number;
  currentMoodAvg: number;
  previousMoodAvg: number;
  moodByDayOfWeek: Array<{ day: number; avg: number; count: number }>;
  entryBreakdown: { audio: number; video: number; text: number };
  moodBreakdown: Array<{ value: number; count: number; percent: number }>;
}

export function useStatsSummary(period: StatsPeriod) {
  return useQuery<StatsSummary>({
    queryKey: ["stats", "summary", period],
    queryFn: async () =>
      (await api.get<StatsSummary>("/api/stats/summary", { params: { period } })).data,
  });
}

export function useHeatmap(year: number, enabled = true) {
  return useQuery<{ year: number; cells: HeatmapCell[] }>({
    queryKey: ["stats", "heatmap", year],
    enabled,
    queryFn: async () =>
      (await api.get<{ year: number; cells: HeatmapCell[] }>("/api/stats/heatmap", {
        params: { year },
      })).data,
  });
}

export interface OnThisDayItem {
  id: string;
  date: string;
  type: string;
  title: string | null;
  yearsAgo: number;
}

export function useOnThisDay() {
  return useQuery<{ items: OnThisDayItem[] }>({
    queryKey: ["stats", "on-this-day"],
    queryFn: async () =>
      (await api.get<{ items: OnThisDayItem[] }>("/api/stats/on-this-day")).data,
  });
}
