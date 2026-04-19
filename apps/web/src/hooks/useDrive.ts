import { useCallback } from "react";
import axios from "axios";
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

export interface ClearDriveStorageResult {
  ok: boolean;
  deletedCount: number;
  failedFiles: string[];
  message: string;
}

export function useDrive(options?: { statusEnabled?: boolean }) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const statusEnabled = options?.statusEnabled !== false;

  const statusQuery = useQuery({
    queryKey: ["drive", "status"],
    queryFn: async () => {
      try {
        return (await api.get<DriveStatus>("/api/drive/status")).data;
      } catch (e) {
        // Cross-origin cookie issues often surface as 401 here; avoid a scary error UI.
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          return {
            connected: false,
            configured: true,
            email: null,
            syncMode: "on-save",
            lastSyncedAt: null,
          } satisfies DriveStatus;
        }
        throw e;
      }
    },
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

  const clearDriveStorage = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<ClearDriveStorageResult>("/api/drive/storage/clear");
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["drive", "storage"] });
      void qc.invalidateQueries({ queryKey: ["drive", "status"] });
      void qc.invalidateQueries({ queryKey: ["export", "estimate"] });
      if (data.failedFiles.length > 0) {
        toast.success(
          data.message,
          `${data.failedFiles.length} file(s) could not be removed from Drive. You can try again later.`,
        );
      } else {
        toast.success(data.message);
      }
    },
    onError: (err) => toast.error("Couldn't clear Drive storage", apiErrorMessage(err)),
  });

  const refetchDrive = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["drive", "status"] });
    void qc.invalidateQueries({ queryKey: ["drive", "storage"] });
  }, [qc]);

  const refetchStorage = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["drive", "storage"] });
  }, [qc]);

  const connectDisabled =
    connect.isPending ||
    (statusQuery.isSuccess && statusQuery.data?.configured === false);

  return {
    status: statusQuery.data,
    statusLoading: statusQuery.isLoading,
    statusError: statusQuery.error,
    isStatusError: statusQuery.isError,
    refetchStatus: statusQuery.refetch,
    storageBytes: storageQuery.data?.storageBytes ?? 0,
    storageLoading: storageQuery.isFetching,
    refetchDrive,
    connect: connect.mutate,
    connectPending: connect.isPending,
    connectDisabled,
    disconnect: disconnect.mutateAsync,
    disconnectPending: disconnect.isPending,
    syncNow: syncNow.mutate,
    syncPending: syncNow.isPending,
    updateSyncMode: updateSyncMode.mutate,
    updateSyncModePending: updateSyncMode.isPending,
    clearDriveStorage: clearDriveStorage.mutateAsync,
    clearDriveStoragePending: clearDriveStorage.isPending,
    refetchStorage,
  };
}
