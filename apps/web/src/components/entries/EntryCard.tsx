import type { EntryType, JournalEntry } from "@luminary/shared";
import { getMoodColor, getMoodEmoji, getMoodLabel, moodFromScore } from "@luminary/shared";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { LucideIcon } from "lucide-react";
import {
  Copy,
  Download,
  FileText,
  Mic,
  MoreHorizontal,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTrashEntry, useUpdateEntry } from "@/hooks/useEntries";
import { apiErrorMessage } from "@/lib/api";
import { mediaFullUrl } from "@/lib/mediaUrl";
import { toast } from "@/lib/toast";
import { cn, formatDuration, formatTime } from "@/lib/utils";

const TYPE_META: Record<
  EntryType,
  { label: string; icon: LucideIcon; badgeClass: string }
> = {
  audio: { label: "Audio", icon: Mic, badgeClass: "bg-accent-subtle text-accent" },
  video: { label: "Video", icon: Video, badgeClass: "bg-success-subtle text-success" },
  text: { label: "Note", icon: FileText, badgeClass: "bg-active text-secondary" },
};

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function EntryCard({
  entry,
  onEdit,
  onRequestReRecord,
}: {
  entry: JournalEntry;
  onEdit?: (entry: JournalEntry) => void;
  onRequestReRecord?: (entry: JournalEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [confirmRerecord, setConfirmRerecord] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(entry.title ?? "");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const trashEntry = useTrashEntry();
  const updateEntry = useUpdateEntry();
  const meta = TYPE_META[entry.type];
  const Icon = meta.icon;
  const moodValue = moodFromScore(entry.mood);

  useEffect(() => {
    setTitleDraft(entry.title ?? "");
  }, [entry.title, entry.id]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const preview =
    entry.type === "text"
      ? (entry.content ?? "")
          .split("\n")
          .slice(0, 1)
          .join(" ")
          .slice(0, 110)
      : entry.type === "audio"
        ? entry.durationSeconds
          ? `${formatDuration(entry.durationSeconds)} recording`
          : "Audio recording"
        : entry.durationSeconds
          ? `${formatDuration(entry.durationSeconds)} video`
          : "Video recording";

  const wordCount =
    entry.type === "text"
      ? (entry.content ?? "").trim().split(/\s+/).filter(Boolean).length
      : null;

  async function handleMoveToTrash() {
    try {
      await trashEntry.mutateAsync(entry.id);
      toast.success("Moved to Trash");
    } catch (err) {
      toast.error("Couldn't move to Trash", apiErrorMessage(err));
    } finally {
      setConfirmTrash(false);
    }
  }

  const saveTitle = useCallback(async () => {
    const next = titleDraft.trim();
    const prev = (entry.title ?? "").trim();
    if (next === prev) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateEntry.mutateAsync({ id: entry.id, title: next || null });
      toast.success("Saved");
      setEditingTitle(false);
    } catch (err) {
      toast.error("Couldn't save title", apiErrorMessage(err));
    }
  }, [entry.id, entry.title, titleDraft, updateEntry]);

  async function handleCopyText() {
    const text = entry.content ?? "";
    const ok = await copyToClipboard(text);
    if (ok) toast.success("Copied to clipboard");
    else toast.error("Couldn't copy", "Clipboard access is blocked in this context.");
  }

  function handleDownload() {
    if (entry.type === "text") {
      const blob = new Blob([entry.content ?? ""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `luminary-${entry.date}-text.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const href = mediaFullUrl(entry.mediaUrl);
    if (!href) {
      toast.error("Download unavailable", "No file is attached to this entry.");
      return;
    }
    const a = document.createElement("a");
    a.href = href;
    a.download = `luminary-${entry.date}-${entry.type}.webm`;
    a.rel = "noopener";
    a.target = "_blank";
    a.click();
  }

  function openPrimary() {
    if (entry.type === "text" && onEdit) onEdit(entry);
    else setOpen(true);
  }

  return (
    <>
      <div className="group relative w-full rounded-lg border border-border-subtle bg-surface p-3.5 transition-colors hover:border-border-default md:mb-2.5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={openPrimary}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                meta.badgeClass,
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                {editingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveTitle();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setTitleDraft(entry.title ?? "");
                        setEditingTitle(false);
                      }
                    }}
                    className="h-8 text-[14px] font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="truncate text-[14px] font-medium text-primary">
                    {entry.title ||
                      (entry.type === "text" ? preview || "Untitled note" : meta.label)}
                  </div>
                )}
                <div className="shrink-0 font-mono text-[11px] text-tertiary">
                  {formatTime(entry.createdAt)}
                </div>
              </div>
              <div className="mt-0.5 flex min-w-0 items-start justify-between gap-2">
                <span className="truncate text-[13px] text-tertiary">
                  {entry.type === "text"
                    ? wordCount != null && wordCount > 0
                      ? `${wordCount} word${wordCount === 1 ? "" : "s"}`
                      : "Empty note"
                    : preview}
                </span>
                <span
                  className="shrink-0 text-right text-[12px] font-semibold"
                  style={{ color: getMoodColor(moodValue) }}
                >
                  {getMoodEmoji(moodValue)} {getMoodLabel(moodValue)}
                </span>
              </div>
            </div>
          </button>

          <AlertDialog.Root open={confirmTrash} onOpenChange={setConfirmTrash}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Entry actions"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-secondary opacity-100 transition-colors hover:bg-hover hover:text-primary md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuItem
                onSelect={() => {
                  setEditingTitle(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                Edit title
              </DropdownMenuItem>
              {entry.type === "text" && (
                <DropdownMenuItem
                  onSelect={() => {
                    void handleCopyText();
                  }}
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Copy text
                </DropdownMenuItem>
              )}
              {(entry.type === "audio" || entry.type === "video") && (
                <DropdownMenuItem
                  onSelect={() => {
                    setConfirmRerecord(true);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Re-record
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  handleDownload();
                }}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                destructive
                onSelect={() => {
                  // Defer dialog open to avoid Radix dismissable-layer pointer-events edge cases.
                  window.setTimeout(() => setConfirmTrash(true), 0);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog.Portal>
              <AlertDialog.Overlay className="alert-overlay" />
              <AlertDialog.Content className="alert-dialog">
                <AlertDialog.Title className="alert-title">Move to Trash?</AlertDialog.Title>
                <AlertDialog.Description className="alert-description">
                  &quot;{entry.title || `${entry.type} entry`}&quot; will be moved to Trash. You can
                  restore it within 15 days before it&apos;s permanently deleted.
                </AlertDialog.Description>
                <div className="alert-actions">
                  <AlertDialog.Cancel asChild>
                    <button type="button" className="btn-secondary">
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      className="btn-destructive"
                      onClick={() => void handleMoveToTrash()}
                    >
                      Move to Trash
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{entry.title || "Untitled entry"}</DialogTitle>
            <DialogDescription>
              {formatTime(entry.createdAt)} · {meta.label}
            </DialogDescription>
          </DialogHeader>
          {entry.type === "audio" && entry.mediaUrl && (
            <audio src={mediaFullUrl(entry.mediaUrl)} controls className="mt-2 w-full" />
          )}
          {entry.type === "video" && entry.mediaUrl && (
            <video
              src={mediaFullUrl(entry.mediaUrl)}
              controls
              className="mt-2 w-full rounded-md"
            />
          )}
          {entry.type === "text" && (
            <div className="mt-2 max-h-[60vh] overflow-auto whitespace-pre-wrap text-[13px] leading-relaxed">
              {entry.content}
            </div>
          )}
          {(entry.type === "audio" || entry.type === "video") && !entry.mediaUrl && (
            <div className="flex items-center justify-center gap-3 py-6 text-secondary">
              <Play className="h-4 w-4" /> Media unavailable
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRerecord} onOpenChange={setConfirmRerecord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace recording?</DialogTitle>
            <DialogDescription>
              This will replace your current recording. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmRerecord(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmRerecord(false);
                onRequestReRecord?.(entry);
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
