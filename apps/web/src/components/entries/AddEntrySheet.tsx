import type { LucideIcon } from "lucide-react";
import { FileText, Mic, Video } from "lucide-react";
import { AudioRecorder } from "@/components/entries/AudioRecorder";
import { TextEditor } from "@/components/entries/TextEditor";
import { VideoRecorder } from "@/components/entries/VideoRecorder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AddEntryMode = null | "pick" | "audio" | "video" | "text";

export function AddEntrySheet({
  mode,
  date,
  isMobile,
  onModeChange,
  onClose,
  replaceEntryId,
}: {
  mode: AddEntryMode;
  date: string;
  isMobile: boolean;
  onModeChange: (m: AddEntryMode) => void;
  onClose: () => void;
  replaceEntryId?: string | null;
}) {
  return (
    <>
      <Dialog
        open={mode === "pick"}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent position={isMobile ? "bottom-sheet" : "center"}>
          <DialogHeader>
            <DialogTitle>Add an entry</DialogTitle>
            <div className="text-base text-secondary">
              What would you like to capture today?
            </div>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2.5 mt-1">
            <PickerCard
              icon={Mic}
              label="Audio"
              sub="Voice memo"
              onClick={() => onModeChange("audio")}
            />
            <PickerCard
              icon={Video}
              label="Video"
              sub="Up to 5 min"
              onClick={() => onModeChange("video")}
            />
            <PickerCard
              icon={FileText}
              label="Text"
              sub="Write freely"
              onClick={() => onModeChange("text")}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "audio"}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent position={isMobile ? "bottom-sheet" : "center"}>
          <DialogHeader>
            <DialogTitle>Record audio</DialogTitle>
          </DialogHeader>
          <AudioRecorder
            date={date}
            onDone={onClose}
            onCancel={onClose}
            replaceEntryId={replaceEntryId ?? undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "video"}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent
          position={isMobile ? "bottom-sheet" : "center"}
          className="md:max-w-[640px]"
        >
          <DialogHeader>
            <DialogTitle>Record video</DialogTitle>
          </DialogHeader>
          <VideoRecorder
            date={date}
            onDone={onClose}
            onCancel={onClose}
            replaceEntryId={replaceEntryId ?? undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "text"}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent
          position={isMobile ? "bottom-sheet" : "center"}
          className="md:max-w-[620px]"
        >
          <DialogHeader>
            <DialogTitle>Write an entry</DialogTitle>
          </DialogHeader>
          <TextEditor date={date} onDone={onClose} onCancel={onClose} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PickerCard({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface px-4 py-6 hover:border-accent-border hover:bg-accent-subtle transition-colors"
    >
      <Icon
        className="h-6 w-6 text-secondary group-hover:text-accent transition-colors"
        strokeWidth={1.5}
      />
      <div className="text-sm font-medium text-primary mt-1">{label}</div>
      <div className="text-xs text-tertiary">{sub}</div>
    </button>
  );
}
