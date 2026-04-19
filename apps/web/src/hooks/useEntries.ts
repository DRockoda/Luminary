import type { JournalEntry } from "@luminary/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const base = "/api/entries";

export function useEntriesRange(from?: string, to?: string) {
  return useQuery<JournalEntry[]>({
    queryKey: ["entries", "range", from, to],
    enabled: Boolean(from && to),
    queryFn: async () => {
      const { data } = await api.get<{ entries: JournalEntry[] }>(base, {
        params: { from, to },
      });
      return data.entries;
    },
  });
}

export function useEntriesForDate(date?: string) {
  return useQuery<JournalEntry[]>({
    queryKey: ["entries", "date", date],
    enabled: Boolean(date),
    queryFn: async () => {
      const { data } = await api.get<{ entries: JournalEntry[] }>(base, {
        params: { date },
      });
      return data.entries;
    },
  });
}

export function useCreateTextEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      date: string;
      title?: string;
      content: string;
      mood?: number;
    }) => {
      const { data } = await api.post<{ entry: JournalEntry }>(base, input);
      return data.entry;
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["entries", "date", entry.date] });
      qc.invalidateQueries({ queryKey: ["entries", "range"] });
      qc.invalidateQueries({ queryKey: ["entries", "search"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUploadMediaEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      date: string;
      type: "audio" | "video";
      file: Blob;
      title?: string;
      durationSeconds?: number;
      mood?: number;
    }) => {
      const form = new FormData();
      form.append("date", input.date);
      form.append("type", input.type);
      if (input.title) form.append("title", input.title);
      if (input.mood != null) form.append("mood", String(input.mood));
      if (input.durationSeconds != null)
        form.append("durationSeconds", String(Math.round(input.durationSeconds)));
      const ext = input.type === "audio" ? "webm" : "webm";
      form.append("file", input.file, `${input.type}-${Date.now()}.${ext}`);
      const { data } = await api.post<{ entry: JournalEntry }>(`${base}/media`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.entry;
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["entries", "date", entry.date] });
      qc.invalidateQueries({ queryKey: ["entries", "range"] });
      qc.invalidateQueries({ queryKey: ["entries", "search"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

/** Move entry to trash (soft delete). */
export function useTrashEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`${base}/${id}/trash`);
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["entries"] });
      const previous = qc
        .getQueriesData<JournalEntry[]>({ queryKey: ["entries"] })
        .map(([key, data]) => ({ key, data }));
      for (const { key, data } of previous) {
        if (!data) continue;
        qc.setQueryData(key, data.filter((e) => e.id !== id));
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      for (const snap of ctx?.previous ?? []) {
        if (snap.data) qc.setQueryData(snap.key, snap.data);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["entries", "search"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      title?: string | null;
      content?: string | null;
      mood?: number;
    }) => {
      const { id, ...body } = input;
      const { data } = await api.patch<{ entry: JournalEntry }>(`${base}/${id}`, body);
      return data.entry;
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["entries", "date", entry.date] });
      qc.invalidateQueries({ queryKey: ["entries", "range"] });
      qc.invalidateQueries({ queryKey: ["entries", "search"] });
    },
  });
}
