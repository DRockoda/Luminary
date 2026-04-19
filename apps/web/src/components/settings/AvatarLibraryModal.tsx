import { AVATAR_LIBRARY } from "@luminary/shared";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TABS = [
  { style: "adventurer" as const, label: "Adventurer" },
  { style: "lorelei" as const, label: "Minimal" },
  { style: "notionists" as const, label: "Playful" },
];

export function AvatarLibraryModal({
  open,
  onOpenChange,
  currentId,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId?: string | null;
  onConfirm: (avatarLibraryId: string) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["style"]>("adventurer");
  const [selectedId, setSelectedId] = useState<string | null>(currentId ?? null);

  const filtered = useMemo(
    () => AVATAR_LIBRARY.filter((a) => a.style === tab),
    [tab],
  );

  const selected = AVATAR_LIBRARY.find((a) => a.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="avatar-library-modal max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Choose an avatar</DialogTitle>
        </DialogHeader>

        <div className="avatar-library-tabs mt-2">
          {TABS.map((t) => (
            <button
              key={t.style}
              type="button"
              className={cn("avatar-library-tab", tab === t.style && "active")}
              onClick={() => setTab(t.style)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="avatar-grid">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("avatar-option", selectedId === item.id && "is-selected")}
              onClick={() => setSelectedId(item.id)}
            >
              <img src={item.url} alt="" />
              <span className="check-overlay">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="avatar-selected-preview">
            <span className="text-secondary">Currently selected:</span>
            <span className="font-medium text-primary">● {selected.name}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedId}
            onClick={() => {
              if (selectedId) onConfirm(selectedId);
              onOpenChange(false);
            }}
          >
            Use this avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
