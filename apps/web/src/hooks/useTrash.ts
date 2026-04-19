import type { JournalEntry } from "@luminary/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const trashBase = "/api/trash";

export function useTrashEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["trash"],
    queryFn: async () => {
      const { data } = await api.get<{ entries: JournalEntry[] }>(trashBase);
      return data.entries;
    },
  });
}

export function useTrashCount() {
  const { data: entries = [] } = useTrashEntries();
  return entries.length;
}

export function useRestoreTrashEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ entry: JournalEntry }>(`${trashBase}/${id}/restore`);
      return data.entry;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function usePermanentDeleteTrashEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${trashBase}/${id}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`${trashBase}/empty`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
