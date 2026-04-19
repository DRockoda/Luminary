import { useQuery } from "@tanstack/react-query";
import type { ActiveAnnouncement } from "@luminary/shared";
import { api } from "@/lib/api";

export function useActiveAnnouncement() {
  return useQuery({
    queryKey: ["announcement", "active"],
    queryFn: async () =>
      (await api.get<{ announcement: ActiveAnnouncement | null }>("/api/announcements/active")).data
        .announcement,
    staleTime: 5 * 60 * 1000,
  });
}
