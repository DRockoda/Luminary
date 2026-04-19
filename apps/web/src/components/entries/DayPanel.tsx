import type { JournalEntry } from "@luminary/shared";
import { dayMoodFromEntries, getMoodEmoji, getMoodLabel } from "@luminary/shared";
import { format, isAfter } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { AddEntrySheet, type AddEntryMode } from "@/components/entries/AddEntrySheet";
import { EntryCard } from "@/components/entries/EntryCard";
import { TextEditor } from "@/components/entries/TextEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntriesForDate } from "@/hooks/useEntries";
import { cn, toIsoDate } from "@/lib/utils";

interface Props {
  date: string;
  variant: "drawer" | "page";
  onClose?: () => void;
  isMobile?: boolean;
}

export function DayPanel({ date, variant, onClose, isMobile = false }: Props) {
  const dateObj = parseDate(date);
  const today = new Date();
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isFuture = isAfter(dateObj, today0);
  const isToday = toIsoDate(dateObj) === toIsoDate(today);

  const { data: entries = [], isLoading } = useEntriesForDate(date);
  const overallMood = entries.length ? dayMoodFromEntries(entries) : null;

  const [addMode, setAddMode] = useState<AddEntryMode>(null);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [replaceEntryId, setReplaceEntryId] = useState<string | null>(null);

  const isDrawer = variant === "drawer";

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-base",
        isDrawer && "border-l border-border-default",
      )}
    >
      <header
        className={cn(
          "flex h-[52px] shrink-0 items-center justify-between border-b border-border-default px-5 md:px-6",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={isDrawer ? "Close" : "Back"}
              className="h-7 w-7 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors -ml-1"
            >
              {isDrawer ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <ArrowLeft className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <div className="min-w-0">
            <div className="text-lg font-semibold text-primary truncate">
              {format(dateObj, "EEEE, d MMM")}
            </div>
            <div className="text-xs text-tertiary font-mono">
              {isToday ? "Today" : isFuture ? "Future" : format(dateObj, "yyyy")}
            </div>
          </div>
        </div>
        {!isFuture && (
          <Button
            size="sm"
            onClick={() => {
              setReplaceEntryId(null);
              setAddMode("pick");
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </header>

      {!isFuture && entries.length > 0 && overallMood && (
        <div className="border-b border-border-subtle px-5 py-2.5 md:px-6">
          <div className="text-[13px] text-secondary">
            Overall mood:{" "}
            <span className="font-semibold text-primary">
              {getMoodEmoji(overallMood)} {getMoodLabel(overallMood)}
            </span>
            {entries.length > 1 && (
              <span className="text-tertiary"> (avg of {entries.length} entries)</span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto px-5 py-5 md:px-6">
        {isLoading ? (
          <EntriesSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState isFuture={isFuture} />
        ) : (
          <motion.div
            className="flex flex-col gap-2.5"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            initial="hidden"
            animate="show"
          >
            {entries.map((e) => (
              <motion.div
                key={e.id}
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.98 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                <EntryCard
                  entry={e}
                  onEdit={(entry) => setEditing(entry)}
                  onRequestReRecord={(entry) => {
                    setReplaceEntryId(entry.id);
                    setAddMode(entry.type === "audio" ? "audio" : "video");
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AddEntrySheet
        mode={addMode}
        date={date}
        isMobile={isMobile}
        onModeChange={setAddMode}
        onClose={() => {
          setAddMode(null);
          setReplaceEntryId(null);
        }}
        replaceEntryId={replaceEntryId}
      />

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent
          position={isMobile ? "bottom-sheet" : "center"}
          className="md:max-w-[620px]"
        >
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
          </DialogHeader>
          {editing && (
            <TextEditor
              date={date}
              initial={{
                id: editing.id,
                title: editing.title,
                content: editing.content,
                mood: editing.mood,
              }}
              onDone={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntriesSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[60px] rounded-lg border border-border-subtle bg-surface animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ isFuture }: { isFuture: boolean }) {
  return (
    <div className="empty-state py-12">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default text-tertiary"
        aria-hidden
      >
        <Pencil className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="empty-state-title">{isFuture ? "Not yet" : "Nothing here yet"}</div>
      <p className="empty-state-body">
        {isFuture
          ? "This day hasn't arrived. Come back to reflect."
          : "Tap + to add your first entry for this day."}
      </p>
    </div>
  );
}

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
