import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserWarning } from "@luminary/shared";
import { api } from "@/lib/api";

export function useWarnings() {
  return useQuery({
    queryKey: ["warnings"],
    queryFn: async () =>
      (await api.get<{ warnings: UserWarning[] }>("/api/warnings")).data.warnings,
    staleTime: 60 * 1000,
  });
}

export function useDismissWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/warnings/${id}/dismiss`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warnings"] });
    },
  });
}
