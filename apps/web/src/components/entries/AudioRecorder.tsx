import type { MoodScore } from "@luminary/shared";
import { motion } from "framer-motion";
import { Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MoodSlider } from "@/components/mood/MoodSlider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useTrashEntry, useUploadMediaEntry } from "@/hooks/useEntries";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { formatDurationClock, triggerHaptic } from "@/lib/utils";

export function AudioRecorder({
  date,
  onDone,
  onCancel,
  replaceEntryId,
}: {
  date: string;
  onDone: () => void;
  onCancel: () => void;
  replaceEntryId?: string;
}) {
  const rec = useMediaRecorder("audio");
  const { mics, selectedMic, setSelectedMic } = useMediaDevices();
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<MoodScore>(5);
  const upload = useUploadMediaEntry();
  const trashEntry = useTrashEntry();

  const elapsedRef = useRef(0);
  const wallStartRef = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!rec.recording) return;
    wallStartRef.current = Date.now();
    elapsedRef.current = 0;
    const id = window.setInterval(() => {
      elapsedRef.current = (Date.now() - wallStartRef.current) / 1000;
      setTick((t) => t + 1);
    }, 100);
    return () => clearInterval(id);
  }, [rec.recording]);

  async function handleStart() {
    triggerHaptic(20);
    await rec.start({ audioDeviceId: selectedMic || undefined });
  }

  function handleStop() {
    triggerHaptic([15, 40, 15]);
    rec.stop();
  }

  async function handleSave() {
    if (!rec.result) return;
    try {
      await upload.mutateAsync({
        date,
        type: "audio",
        file: rec.result.blob,
        title: title || undefined,
        durationSeconds: rec.result.durationSeconds,
        mood,
      });
      if (replaceEntryId) {
        try {
          await trashEntry.mutateAsync(replaceEntryId);
        } catch {
          /* best-effort */
        }
      }
      toast.success("Voice memo saved");
      onDone();
    } catch (err) {
      toast.error("Couldn't save", apiErrorMessage(err));
    }
  }

  function handleMicChange(id: string) {
    setSelectedMic(id);
    if (rec.recording) handleStop();
    if (rec.result) rec.reset();
  }

  const timerDisplay = rec.recording
    ? formatDurationClock(elapsedRef.current)
    : rec.result
      ? formatDurationClock(rec.result.durationSeconds)
      : "00:00";

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-5 py-6">
        <button
          type="button"
          onClick={rec.recording ? handleStop : handleStart}
          disabled={Boolean(rec.result)}
          className={
            "relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-white transition-transform active:scale-95 disabled:opacity-50 " +
            (rec.recording ? "recording-pulse" : "")
          }
          aria-label={rec.recording ? "Stop recording" : "Start recording"}
        >
          {rec.recording ? (
            <Square className="h-6 w-6 fill-current" />
          ) : (
            <Mic className="h-7 w-7" />
          )}
        </button>

        <div className="font-mono text-[28px] font-medium tabular-nums leading-none text-primary">
          {timerDisplay}
        </div>
        {rec.recording && <Waveform level={rec.level} />}
        {rec.result && !rec.recording && (
          <audio controls src={rec.result.url} className="w-full" />
        )}
        {rec.error && <p className="text-sm text-danger">{rec.error}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] text-secondary" htmlFor="luminary-audio-mic">
          Microphone
        </label>
        <select
          id="luminary-audio-mic"
          className="flex h-10 w-full rounded-md border border-border-default bg-surface px-3.5 text-[14px] text-primary focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
          value={selectedMic}
          onChange={(e) => handleMicChange(e.target.value)}
          disabled={rec.recording}
        >
          {mics.map((m) => (
            <option key={m.deviceId} value={m.deviceId}>
              {m.label || "Microphone"}
            </option>
          ))}
        </select>
      </div>

      {rec.result && (
        <Input
          placeholder="Optional title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}

      {rec.result && <MoodSlider value={mood} onChange={setMood} />}

      <div className="flex justify-end gap-2">
        {rec.result ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={rec.reset}
              disabled={upload.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Re-record
            </Button>
            <Button type="button" onClick={handleSave} disabled={upload.isPending}>
              {upload.isPending ? <Spinner /> : "Save memo"}
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function Waveform({ level }: { level: number }) {
  const bars = 32;
  return (
    <div className="flex h-8 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => {
        const phase = (i / bars) * Math.PI * 2;
        const h =
          4 + Math.abs(Math.sin(phase + Date.now() / 120)) * 22 * (0.35 + level);
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-accent"
            animate={{ height: h }}
            transition={{ duration: 0.08 }}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}
