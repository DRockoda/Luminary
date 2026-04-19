import type { MoodScore } from "@luminary/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MoodSlider } from "@/components/mood/MoodSlider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { useCreateTextEntry, useUpdateEntry } from "@/hooks/useEntries";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  initial?: {
    id?: string;
    title?: string | null;
    content?: string | null;
    mood?: MoodScore;
  };
  onDone: () => void;
  onCancel: () => void;
}

const DRAFT_PREFIX = "luminary-draft-";

export function TextEditor({ date, initial, onDone, onCancel }: Props) {
  const draftKey = useMemo(
    () => `${DRAFT_PREFIX}${initial?.id ?? `new-${date}`}`,
    [date, initial?.id],
  );

  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState<string>(() => {
    if (initial?.content) return initial.content;
    try {
      return localStorage.getItem(draftKey) ?? "";
    } catch {
      return "";
    }
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const [mood, setMood] = useState<MoodScore>(() => initial?.mood ?? 5);
  const create = useCreateTextEntry();
  const update = useUpdateEntry();
  const lastSavedRef = useRef(content);

  useEffect(() => {
    if (initial?.mood != null) setMood(initial.mood);
  }, [initial?.id, initial?.mood]);

  useEffect(() => {
    if (initial?.id) return;
    const id = window.setInterval(() => {
      if (content === lastSavedRef.current) return;
      try {
        if (content.trim()) localStorage.setItem(draftKey, content);
        else localStorage.removeItem(draftKey);
        lastSavedRef.current = content;
        setDraftSaved(true);
        window.setTimeout(() => setDraftSaved(false), 2000);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [content, draftKey, initial?.id]);

  const pending = create.isPending || update.isPending;

  async function handleSave() {
    if (!content.trim()) {
      toast.error("Nothing to save", "Your entry is empty.");
      return;
    }
    try {
      if (initial?.id) {
        await update.mutateAsync({
          id: initial.id,
          title: title.trim() || null,
          content,
          mood,
        });
        toast.success("Entry updated");
      } else {
        await create.mutateAsync({
          date,
          title: title.trim() || undefined,
          content,
          mood,
        });
        toast.success("Entry saved");
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
      }
      onDone();
    } catch (err) {
      toast.error("Couldn't save", apiErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full bg-transparent border-0 outline-none text-lg font-medium text-primary placeholder:text-tertiary pb-2 border-b border-border-subtle"
      />
      <textarea
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={10}
        className="w-full bg-transparent border-0 outline-none text-md text-primary placeholder:text-tertiary resize-none leading-[1.7] min-h-[220px]"
      />
      <div className="flex items-center justify-between text-xs font-mono text-tertiary">
        <div className="flex items-center gap-1.5 h-4">
          <AnimatePresence>
            {pending ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </motion.span>
            ) : draftSaved && !initial?.id ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-success"
              >
                <Check className="h-3 w-3" /> Saved
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <div className={cn(content.length > 3000 && "text-warning")}>
          {content.length.toLocaleString()} chars
        </div>
      </div>

      <MoodSlider value={mood} onChange={setMood} />

      <div className="flex gap-2 justify-end pt-3 border-t border-border-subtle">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={pending}>
          {pending ? <Spinner /> : initial?.id ? "Update entry" : "Save entry"}
        </Button>
      </div>
    </div>
  );
}
