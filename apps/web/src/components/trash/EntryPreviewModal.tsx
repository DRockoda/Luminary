import {
  getMoodColor,
  getMoodEmoji,
  getMoodLabel,
  moodFromScore,
  type JournalEntry,
} from "@luminary/shared";
import { format, parseISO } from "date-fns";
import { AlertCircle, Mic, RotateCcw, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mediaFullUrl } from "@/lib/mediaUrl";
import { formatDuration } from "@/lib/utils";

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function getDaysUntilDeletion(deletedAt?: string | null) {
  if (!deletedAt) return 0;
  const d = parseISO(deletedAt);
  const deleteOn = new Date(d.getTime() + 15 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((deleteOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function EntryPreviewModal({
  entry,
  isOpen,
  onClose,
  onRestore,
}: {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
}) {
  if (!entry) return null;
  const moodValue = moodFromScore(entry.mood);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="entry-preview-modal" showClose={false}>
        <div className="preview-modal-header">
          <div className="preview-modal-title-row">
            <DialogHeader className="mb-0">
              <DialogTitle className="preview-modal-title">
                {entry.title || `${capitalize(entry.type)} entry`}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="preview-modal-meta">
            <span>{format(parseISO(entry.date), "EEEE, MMMM d, yyyy")}</span>
            <span className="meta-dot">·</span>
            <span>{format(parseISO(entry.createdAt), "h:mm a")}</span>
            <span className="meta-dot">·</span>
            <span style={{ color: getMoodColor(moodValue) }}>
              {getMoodEmoji(moodValue)} {getMoodLabel(moodValue)}
            </span>
          </div>
          <div className="preview-modal-trash-notice">
            <AlertCircle size={12} />
            In Trash · {getDaysUntilDeletion(entry.deletedAt)} days until permanent deletion
          </div>
          <button type="button" className="preview-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="preview-modal-body">
          {entry.type === "text" && <div className="preview-text-content">{entry.content}</div>}

          {entry.type === "audio" && (
            <div className="preview-audio-player">
              <Mic size={32} color="var(--accent)" />
              <audio controls src={mediaFullUrl(entry.mediaUrl)} style={{ width: "100%", marginTop: 16 }} />
              <p className="preview-duration">
                Duration: {formatDuration(entry.durationSeconds ?? 0)}
              </p>
            </div>
          )}

          {entry.type === "video" && (
            <div className="preview-video-player">
              <video
                controls
                src={mediaFullUrl(entry.mediaUrl)}
                style={{ width: "100%", borderRadius: "var(--radius-lg)", background: "#000" }}
              />
            </div>
          )}
        </div>

        <div className="preview-modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onRestore(entry.id);
              onClose();
            }}
          >
            <RotateCcw size={14} />
            Restore Entry
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

