import type { EntryType, JournalEntry } from "@luminary/shared";
import { format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { Clock, FileText, Mic, RotateCcw, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntryPreviewModal } from "@/components/trash/EntryPreviewModal";
import { Spinner } from "@/components/ui/spinner";
import {
  useEmptyTrash,
  usePermanentDeleteTrashEntry,
  useRestoreTrashEntry,
  useTrashEntries,
} from "@/hooks/useTrash";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  EntryType,
  { label: string; icon: LucideIcon; badgeClass: string }
> = {
  audio: { label: "Audio", icon: Mic, badgeClass: "bg-accent-subtle text-accent" },
  video: { label: "Video", icon: Video, badgeClass: "bg-success-subtle text-success" },
  text: { label: "Note", icon: FileText, badgeClass: "bg-active text-secondary" },
};

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function getDaysUntilDeletion(deletedAt: string): number {
  const d = parseISO(deletedAt);
  const deleteOn = new Date(d.getTime() + 15 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((deleteOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function TrashPage() {
  const { data: entries = [], isLoading } = useTrashEntries();
  const restore = useRestoreTrashEntry();
  const permanentDelete = usePermanentDeleteTrashEntry();
  const emptyTrash = useEmptyTrash();

  const [emptyOpen, setEmptyOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<JournalEntry | null>(null);

  async function restoreEntry(id: string) {
    try {
      await restore.mutateAsync(id);
      toast.success("Entry restored");
    } catch (err) {
      toast.error("Couldn't restore", apiErrorMessage(err));
    }
  }

  async function deleteForever(id: string) {
    try {
      await permanentDelete.mutateAsync(id);
      toast.success("Entry permanently deleted");
    } catch (err) {
      toast.error("Couldn't delete", apiErrorMessage(err));
    }
  }

  async function confirmEmptyTrash() {
    try {
      await emptyTrash.mutateAsync();
      toast.success("Trash emptied");
    } catch (err) {
      toast.error("Couldn't empty Trash", apiErrorMessage(err));
    } finally {
      setEmptyOpen(false);
    }
  }

  return (
    <div className="main-content pb-24">
      <PageContainer>
        <PageHeader
          title="Trash"
          description="Deleted entries are kept here for 15 days before being removed permanently."
          actions={
            entries.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 border text-danger"
                style={{ borderColor: "rgba(var(--danger-rgb), 0.3)" }}
                onClick={() => setEmptyOpen(true)}
              >
                Empty Trash
              </Button>
            ) : null
          }
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trash2
              className="mb-3 text-tertiary"
              style={{ width: 40, height: 40 }}
              strokeWidth={1.25}
            />
            <p className="text-base font-medium text-primary">Trash is empty</p>
            <p className="mt-1 max-w-sm text-sm text-secondary">
              Deleted entries will appear here for 15 days.
            </p>
          </div>
        ) : (
          <ul className="list-none p-0">
            {entries.map((entry) => (
              <TrashEntryRow
                key={entry.id}
                entry={entry}
                onPreview={() => setPreviewEntry(entry)}
                onRestore={() => void restoreEntry(entry.id)}
                onPermanentDelete={() => void deleteForever(entry.id)}
                restoring={restore.isPending && restore.variables === entry.id}
                deleting={permanentDelete.isPending && permanentDelete.variables === entry.id}
              />
            ))}
          </ul>
        )}
      </PageContainer>

      <EntryPreviewModal
        entry={previewEntry}
        isOpen={Boolean(previewEntry)}
        onClose={() => setPreviewEntry(null)}
        onRestore={(id) => void restoreEntry(id)}
      />

      <AlertDialog open={emptyOpen} onOpenChange={setEmptyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              All {entries.length} {entries.length === 1 ? "entry" : "entries"} will be
              permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void confirmEmptyTrash()}
              disabled={emptyTrash.isPending}
            >
              {emptyTrash.isPending ? <Spinner /> : "Empty Trash"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TrashEntryRow({
  entry,
  onPreview,
  onRestore,
  onPermanentDelete,
  restoring,
  deleting,
}: {
  entry: JournalEntry;
  onPreview: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  restoring: boolean;
  deleting: boolean;
}) {
  const meta = TYPE_META[entry.type];
  const Icon = meta.icon;
  const deletedAt = entry.deletedAt ?? entry.updatedAt;
  const daysLeft = getDaysUntilDeletion(deletedAt);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <li
      className="trash-entry-card"
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(e) => e.key === "Enter" && onPreview()}
    >
      <div className="trash-entry-left">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            meta.badgeClass,
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="trash-entry-title">
            {entry.title || `${capitalize(entry.type)} entry`}
          </p>
          <p className="trash-entry-meta">
            {format(parseISO(entry.date), "MMM d, yyyy")} ·{" "}
            {format(parseISO(entry.createdAt), "h:mm a")}
          </p>
          <p className={cn("trash-entry-countdown", daysLeft < 3 && "urgent")}>
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
            {daysLeft} days until permanent deletion
          </p>
        </div>
      </div>
      <div className="trash-entry-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="trash-action-btn trash-action-restore"
          onClick={onRestore}
          disabled={restoring || deleting}
          title="Restore entry"
          type="button"
        >
          <RotateCcw size={13} />
          <span>Restore</span>
        </button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <button
            className="trash-action-btn trash-action-delete"
            onClick={() => setConfirmOpen(true)}
            disabled={restoring || deleting}
            title="Delete permanently"
            type="button"
          >
            <Trash2 size={13} />
            <span>Delete forever</span>
          </button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This entry will be deleted forever and cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmOpen(false);
                  onPermanentDelete();
                }}
              >
                Delete forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
