import type { MoodLog, MoodSummary } from "@luminary/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMoodRange(from?: string, to?: string) {
  return useQuery<MoodLog[]>({
    queryKey: ["mood", "range", from, to],
    enabled: Boolean(from && to),
    queryFn: async () => {
      const { data } = await api.get<{ moods: MoodLog[] }>("/api/mood", {
        params: { from, to },
      });
      return data.moods;
    },
  });
}

export function useMoodSummary(period: MoodSummary["period"]) {
  return useQuery<MoodSummary>({
    queryKey: ["mood", "summary", period],
    queryFn: async () => {
      const { data } = await api.get<{ summary: MoodSummary }>("/api/mood/summary", {
        params: { period },
      });
      return data.summary;
    },
  });
}

export function useSetMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { date: string; mood: MoodLog["mood"] }) => {
      const { data } = await api.post<{ mood: MoodLog }>("/api/mood", input);
      return data.mood;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mood"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
