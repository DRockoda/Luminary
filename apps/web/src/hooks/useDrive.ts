import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/authStore";

export interface DriveStatus {
  connected: boolean;
  configured: boolean;
  email: string | null;
  syncMode: "on-save" | "hourly" | "daily" | "manual";
  lastSyncedAt: string | null;
}

export function useDrive(options?: { statusEnabled?: boolean }) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const statusEnabled = options?.statusEnabled !== false;

  const statusQuery = useQuery({
    queryKey: ["drive", "status"],
    queryFn: async () => (await api.get<DriveStatus>("/api/drive/status")).data,
    enabled: statusEnabled,
  });

  const storageQuery = useQuery({
    queryKey: ["drive", "storage"],
    queryFn: async () => (await api.get<{ storageBytes: number; stale?: boolean }>("/api/drive/storage")).data,
    enabled: Boolean(statusQuery.data?.connected),
  });

  const connect = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ url: string }>("/api/drive/connect");
      window.location.href = data.url;
    },
    onError: (err) => toast.error("Couldn't start Drive flow", apiErrorMessage(err)),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      await api.post("/api/drive/disconnect");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive", "status"] });
      qc.invalidateQueries({ queryKey: ["drive", "storage"] });
      api.get("/api/auth/me").then(({ data }) => setUser(data.user)).catch(() => {});
      toast.success("Google Drive disconnected");
    },
    onError: (err) => toast.error("Couldn't disconnect", apiErrorMessage(err)),
  });

  const syncNow = useMutation({
    mutationFn: async () => {
      await api.post("/api/drive/sync");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive", "status"] });
      qc.invalidateQueries({ queryKey: ["drive", "storage"] });
      toast.success("Sync complete");
    },
    onError: (err) => toast.error("Sync failed", apiErrorMessage(err)),
  });

  const updateSyncMode = useMutation({
    mutationFn: async (syncMode: DriveStatus["syncMode"]) => {
      await api.patch("/api/drive/settings", { syncMode });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive", "status"] });
    },
    onError: (err) => toast.error("Couldn't save", apiErrorMessage(err)),
  });

  const refetchDrive = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["drive", "status"] });
    void qc.invalidateQueries({ queryKey: ["drive", "storage"] });
  }, [qc]);

  return {
    status: statusQuery.data,
    statusLoading: statusQuery.isLoading,
    storageBytes: storageQuery.data?.storageBytes ?? 0,
    storageLoading: storageQuery.isFetching,
    refetchDrive,
    connect: connect.mutate,
    connectPending: connect.isPending,
    disconnect: disconnect.mutateAsync,
    disconnectPending: disconnect.isPending,
    syncNow: syncNow.mutate,
    syncPending: syncNow.isPending,
    updateSyncMode: updateSyncMode.mutate,
    updateSyncModePending: updateSyncMode.isPending,
  };
}
