import { useEffect, useState } from "react";
import { activeAnnouncementUrl } from "@/lib/apiBaseUrl";

const POLL_MS = 60_000;

export function useMaintenanceMode(enabled: boolean) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsMaintenanceMode(false);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(activeAnnouncementUrl(), {
          credentials: "omit",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          announcement: { isMaintenance?: boolean } | null;
        };
        if (!cancelled) {
          setIsMaintenanceMode(Boolean(data?.announcement?.isMaintenance));
        }
      } catch {
        if (!cancelled) setIsMaintenanceMode(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void check();
    const id = window.setInterval(() => void check(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);

  return { isMaintenanceMode, isLoading };
}
