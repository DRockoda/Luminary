import type { JournalEntry } from "@luminary/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function useEntrySearch(searchQuery: string) {
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300);
  const query = useQuery<JournalEntry[]>({
    queryKey: ["entries", "search", debouncedQuery],
    enabled: debouncedQuery.length > 0,
    queryFn: async () => {
      const { data } = await api.get<{ entries: JournalEntry[] }>("/api/entries/search", {
        params: { q: debouncedQuery },
      });
      return data.entries;
    },
  });
  return { ...query, debouncedQuery };
}
