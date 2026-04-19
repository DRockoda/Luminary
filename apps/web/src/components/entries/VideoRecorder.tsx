import type { MoodScore } from "@luminary/shared";
import { Mic, Pause, Play, Square, Video, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MoodSlider } from "@/components/mood/MoodSlider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useTrashEntry, useUploadMediaEntry } from "@/hooks/useEntries";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { formatDurationClock, triggerHaptic } from "@/lib/utils";

const MAX_SECONDS = 5 * 60;
const WARN_SECONDS = 4 * 60 + 45;

type Phase =
  | "requesting-permissions"
  | "ready"
  | "recording"
  | "paused"
  | "preview"
  | "saving";

function pickMime(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return undefined;
}

function isLikelyFrontCamera(label: string): boolean {
  const l = label.toLowerCase();
  return (
    l.includes("front") ||
    l.includes("facetime") ||
    l.includes("user-facing") ||
    (l.includes("camera") && l.includes("built-in") && !l.includes("back"))
  );
}

export function VideoRecorder({
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
  const { cameras, mics, selectedCamera, selectedMic, setSelectedCamera, setSelectedMic } =
    useMediaDevices();

  const [phase, setPhase] = useState<Phase>("requesting-permissions");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<MoodScore>(5);
  const [mirror, setMirror] = useState(true);
  const [, setTick] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const streamRef = useRef<MediaStream | null>(null);
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const warnedRef = useRef(false);
  const tickIntervalRef = useRef<number | null>(null);
  const openRequestId = useRef(0);

  const upload = useUploadMediaEntry();
  const trashEntry = useTrashEntry();

  const stopTick = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoLiveRef.current) videoLiveRef.current.srcObject = null;
  }, []);

  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    const v = videoLiveRef.current;
    if (v) {
      v.srcObject = stream;
      void v.play().catch(() => undefined);
    }
  }, []);

  const openCamera = useCallback(async () => {
    const req = ++openRequestId.current;
    setError(null);
    setPhase("requesting-permissions");
    stopTick();
    stopStream();
    try {
      const video: MediaTrackConstraints = selectedCamera
        ? { deviceId: { exact: selectedCamera } }
        : { facingMode: "user" };
      const constraints: MediaStreamConstraints = {
        video,
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (req !== openRequestId.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const vtrack = stream.getVideoTracks()[0];
      setMirror(isLikelyFrontCamera(vtrack?.label ?? ""));
      attachStream(stream);
      setPhase("ready");
    } catch (e) {
      if (req !== openRequestId.current) return;
      setError(
        (e as Error).message?.includes("Permission") || (e as Error).name === "NotAllowedError"
          ? "Camera and microphone access was denied. Enable them in your browser settings for this site, then try again."
          : "Could not access camera or microphone. Check permissions and devices.",
      );
      setPhase("ready");
      stopStream();
    }
  }, [attachStream, selectedCamera, selectedMic, stopStream, stopTick]);

  useEffect(() => {
    if (
      phaseRef.current === "recording" ||
      phaseRef.current === "paused" ||
      phaseRef.current === "preview" ||
      phaseRef.current === "saving"
    ) {
      return;
    }
    void openCamera();
    return () => {
      openRequestId.current += 1;
    };
  }, [openCamera]);

  useEffect(
    () => () => {
      stopTick();
      stopStream();
    },
    [stopStream, stopTick],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (phase !== "recording") return;
    warnedRef.current = false;
    tickIntervalRef.current = window.setInterval(() => {
      elapsedRef.current += 0.1;
      if (elapsedRef.current >= WARN_SECONDS && !warnedRef.current) {
        warnedRef.current = true;
        toast.info("30 seconds remaining", "Recording will stop automatically at 5 minutes.");
      }
      if (elapsedRef.current >= MAX_SECONDS) {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state !== "inactive") {
          stopTick();
          mr.stop();
        }
        return;
      }
      setTick((t) => t + 1);
    }, 100);
    return () => {
      stopTick();
    };
  }, [phase, stopTick]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    triggerHaptic(20);
    chunksRef.current = [];
    elapsedRef.current = 0;
    warnedRef.current = false;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const mime = pickMime();
    let mr: MediaRecorder;
    try {
      mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      toast.error("Recording not supported", "Try another browser or check codecs.");
      return;
    }

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      stopTick();
      stopStream();
      const type = mr.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPhase("preview");
      mediaRecorderRef.current = null;
    };

    mediaRecorderRef.current = mr;
    mr.start(1000);
    setPhase("recording");
  }, [stopStream, stopTick]);

  const pauseRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr?.state === "recording") {
      mr.pause();
      setPhase("paused");
      stopTick();
    }
  }, [stopTick]);

  const resumeRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr?.state === "paused") {
      mr.resume();
      setPhase("recording");
    }
  }, []);

  const stopRecording = useCallback(() => {
    stopTick();
    mediaRecorderRef.current?.stop();
  }, [stopTick]);

  async function handleSave() {
    if (!previewUrl) return;
    const res = await fetch(previewUrl);
    const blob = await res.blob();
    setPhase("saving");
    try {
      await upload.mutateAsync({
        date,
        type: "video",
        file: blob,
        title: title || undefined,
        durationSeconds: Math.min(elapsedRef.current, MAX_SECONDS),
        mood,
      });
      if (replaceEntryId) {
        try {
          await trashEntry.mutateAsync(replaceEntryId);
        } catch {
          /* best-effort */
        }
      }
      toast.success("Video entry saved");
      onDone();
    } catch (err) {
      setPhase("preview");
      toast.error("Couldn't save", apiErrorMessage(err));
    }
  }

  async function handleRecordAgain() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    elapsedRef.current = 0;
    setPhase("requesting-permissions");
    await openCamera();
  }

  const displayTime = formatDurationClock(elapsedRef.current);

  const showLive =
    phase === "ready" ||
    phase === "recording" ||
    phase === "paused" ||
    phase === "requesting-permissions";
  const showPreviewVideo = phase === "preview" || phase === "saving";

  const blocked = phase === "recording" || phase === "paused" || phase === "preview" || phase === "saving";

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border-subtle bg-black">
        {showPreviewVideo && previewUrl && (
          <video
            src={previewUrl}
            controls
            className="h-full w-full object-cover"
          />
        )}

        {showLive && (
          <video
            ref={videoLiveRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            style={mirror ? { transform: "scaleX(-1)" } : undefined}
          />
        )}

        {phase === "requesting-permissions" && !error && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/50">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center text-[13px] leading-relaxed text-white">
            <p>{error}</p>
            <Button type="button" size="sm" variant="secondary" onClick={() => void openCamera()}>
              Try again
            </Button>
          </div>
        )}

        {showLive && !error && phase !== "requesting-permissions" && (
          <>
            <div className="pointer-events-auto absolute left-2 top-2 z-10">
              <DeviceOverlaySelect
                icon={<Video className="h-3 w-3 shrink-0" />}
                value={selectedCamera}
                onChange={(id) => setSelectedCamera(id)}
                options={cameras.map((c) => ({ id: c.deviceId, label: c.label || "Camera" }))}
                disabled={blocked}
              />
            </div>
            <div className="pointer-events-auto absolute right-2 top-2 z-10">
              <DeviceOverlaySelect
                icon={<Mic className="h-3 w-3 shrink-0" />}
                value={selectedMic}
                onChange={(id) => setSelectedMic(id)}
                options={mics.map((m) => ({ id: m.deviceId, label: m.label || "Microphone" }))}
                disabled={blocked}
              />
            </div>

            {(phase === "recording" || phase === "paused") && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 font-mono text-base font-medium tabular-nums text-white backdrop-blur-sm">
                {phase === "recording" && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-[#EF4444]"
                    style={{ animation: "statusPulse 1s ease-in-out infinite" }}
                    aria-hidden
                  />
                )}
                {phase === "paused" && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]" aria-hidden />
                )}
                <span>{displayTime}</span>
                {phase === "paused" && (
                  <span className="text-[11px] font-sans font-medium tracking-wide text-white/70">
                    PAUSED
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {phase === "ready" && !error && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
            <button
              type="button"
              onClick={startRecording}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E53935] text-white shadow-md transition-transform active:scale-95"
              aria-label="Start recording"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-white" />
            </button>
          </div>
        )}

        {(phase === "recording" || phase === "paused") && !error && (
          <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-5 px-4">
            {phase === "recording" ? (
              <button
                type="button"
                onClick={pauseRecording}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black shadow-md backdrop-blur-sm transition-transform active:scale-95"
                aria-label="Pause"
              >
                <Pause className="h-5 w-5" fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRecording}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black shadow-md backdrop-blur-sm transition-transform active:scale-95"
                aria-label="Resume"
              >
                <Play className="h-5 w-5 pl-0.5" fill="currentColor" />
              </button>
            )}
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black shadow-md backdrop-blur-sm transition-transform active:scale-95"
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          </div>
        )}
      </div>

      {phase === "preview" && (
        <Input
          placeholder="Optional title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      )}

      {(phase === "preview" || phase === "saving") && (
        <MoodSlider value={mood} onChange={setMood} />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] text-tertiary">Max 05:00</div>
        <div className="flex gap-2">
          {phase === "preview" || phase === "saving" ? (
            <>
              <Button variant="ghost" onClick={() => void handleRecordAgain()} disabled={phase === "saving"}>
                Record again
              </Button>
              <Button onClick={handleSave} disabled={phase === "saving"}>
                {phase === "saving" ? <Spinner /> : "Save entry"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceOverlaySelect({
  icon,
  value,
  onChange,
  options,
  disabled,
}: {
  icon: ReactNode;
  value: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-[12px] text-white backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {icon}
      <select
        disabled={disabled}
        className="max-w-[140px] cursor-pointer truncate border-0 bg-transparent py-0.5 text-[12px] text-white outline-none disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Device"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} className="bg-zinc-900 text-white">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
    </div>
  );
}
