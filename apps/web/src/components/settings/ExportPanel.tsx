import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

interface ExportEstimate {
  textCount: number;
  textBytes: number;
  audioCount: number;
  audioBytes: number;
  audioSeconds: number;
  videoCount: number;
  videoBytes: number;
  videoSeconds: number;
  totalCount: number;
  totalBytes: number;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function ExportPanel() {
  const [includeText, setIncludeText] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");

  const { data: estimate, isLoading } = useQuery<ExportEstimate>({
    queryKey: ["export", "estimate"],
    queryFn: async () =>
      (await api.get<ExportEstimate>("/api/export/estimate")).data,
  });

  function pickedBytes(e?: ExportEstimate): number {
    if (!e) return 0;
    return (
      (includeText ? e.textBytes : 0) +
      (includeAudio ? e.audioBytes : 0) +
      (includeVideo ? e.videoBytes : 0)
    );
  }

  function pickedCount(e?: ExportEstimate): number {
    if (!e) return 0;
    return (
      (includeText ? e.textCount : 0) +
      (includeAudio ? e.audioCount : 0) +
      (includeVideo ? e.videoCount : 0)
    );
  }

  const canExport =
    !!estimate &&
    pickedCount(estimate) > 0 &&
    (includeText || includeAudio || includeVideo);

  async function handleExport() {
    if (!canExport) return;
    setIsExporting(true);
    setExportProgress(5);
    setExportStatus("Preparing entries…");
    try {
      const response = await api.post(
        "/api/export/zip",
        {
          includeText,
          includeAudio,
          includeVideo,
          includeMetadata,
        },
        {
          responseType: "blob",
          onDownloadProgress: (e) => {
            if (e.total) {
              const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
              setExportProgress(pct);
              setExportStatus("Downloading archive…");
            } else {
              // Indeterminate (server hasn't set Content-Length while streaming)
              setExportProgress((p) => Math.min(95, p + 2));
              setExportStatus("Building archive on server…");
            }
          },
        },
      );
      const blob = response.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `luminary-export-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setExportProgress(100);
      setExportStatus("Done");
      toast.success("Export ready", "Your archive has started downloading.");
    } catch (err) {
      toast.error("Export failed", apiErrorMessage(err));
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 800);
    }
  }

  return (
    <div>
      <section className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Export your data</h2>
        </div>
        <div className="export-body">
          <p className="export-intro">
            Download all your entries as a ZIP. Text entries become readable
            <code> .txt</code> files; audio and video are pulled from your
            connected Drive. Files are organised by year and month.
          </p>

          <div className="export-summary-card">
            <div className="export-summary-row">
              <span>Total entries</span>
              <strong>{estimate?.totalCount ?? 0}</strong>
            </div>
            <div className="export-summary-row">
              <span>Text entries</span>
              <span>
                {estimate?.textCount ?? 0} · {formatBytes(estimate?.textBytes ?? 0)}
              </span>
            </div>
            <div className="export-summary-row">
              <span>Audio entries</span>
              <span>
                {estimate?.audioCount ?? 0} ·{" "}
                {formatDuration(estimate?.audioSeconds ?? 0)}
              </span>
            </div>
            <div className="export-summary-row">
              <span>Video entries</span>
              <span>
                {estimate?.videoCount ?? 0} ·{" "}
                {formatDuration(estimate?.videoSeconds ?? 0)}
              </span>
            </div>
            <div className="export-summary-row export-summary-total">
              <span>Estimated export size</span>
              <strong>{formatBytes(pickedBytes(estimate))}</strong>
            </div>
          </div>

          <div className="export-options">
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={includeText}
                onChange={(e) => setIncludeText(e.target.checked)}
              />
              <span>Include text entries</span>
            </label>
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={includeAudio}
                onChange={(e) => setIncludeAudio(e.target.checked)}
              />
              <span>Include audio entries</span>
            </label>
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={includeVideo}
                onChange={(e) => setIncludeVideo(e.target.checked)}
              />
              <span>Include video entries</span>
            </label>
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
              <span>Include metadata JSON (moods, timestamps, etc.)</span>
            </label>
          </div>

          {isExporting ? (
            <div className="export-progress">
              <div className="export-progress-bar-bg">
                <div
                  className="export-progress-bar-fill"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="export-progress-label">
                {exportStatus} ({exportProgress}%)
              </p>
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary export-btn"
              onClick={handleExport}
              disabled={!canExport || isLoading}
            >
              <Download size={14} />
              Export as ZIP · {formatBytes(pickedBytes(estimate))}
            </button>
          )}

          <p className="export-fineprint">
            Large exports may take a few minutes. The file will download
            automatically when ready. Audio and video are pulled live from
            Google Drive — they&apos;re only included if Drive is connected.
          </p>
        </div>
      </section>
    </div>
  );
}
