import { useCallback, useEffect, useRef, useState } from "react";

export interface MediaRecorderResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  mimeType: string;
}

export function useMediaRecorder(kind: "audio" | "video") {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<MediaRecorderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef<number>(0);
  const interval = useRef<number | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const rafId = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (audioCtx.current) {
      audioCtx.current.close().catch(() => undefined);
      audioCtx.current = null;
      analyser.current = null;
    }
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const start = useCallback(
    async (opts?: { facingMode?: "user" | "environment"; audioDeviceId?: string }) => {
      setError(null);
      setResult(null);
      setElapsed(0);
      chunks.current = [];
      try {
        const constraints: MediaStreamConstraints =
          kind === "audio"
            ? {
                audio: opts?.audioDeviceId
                  ? { deviceId: { exact: opts.audioDeviceId } }
                  : true,
              }
            : {
                audio: opts?.audioDeviceId
                  ? { deviceId: { exact: opts.audioDeviceId } }
                  : true,
                video: {
                  facingMode: opts?.facingMode ?? "user",
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              };
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        stream.current = s;

        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const src = ctx.createMediaStreamSource(s);
        const a = ctx.createAnalyser();
        a.fftSize = 256;
        src.connect(a);
        audioCtx.current = ctx;
        analyser.current = a;
        const data = new Uint8Array(a.frequencyBinCount);
        const tick = () => {
          if (!analyser.current) return;
          analyser.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setLevel(Math.min(1, sum / (data.length * 160)));
          rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);

        const mime = pickMime(kind);
        const mr = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.current.push(e.data);
        };
        mr.onstop = () => {
          const type = mr.mimeType || (kind === "audio" ? "audio/webm" : "video/webm");
          const blob = new Blob(chunks.current, { type });
          const url = URL.createObjectURL(blob);
          const duration = (Date.now() - startedAt.current) / 1000;
          setResult({ blob, url, durationSeconds: duration, mimeType: type });
          setRecording(false);
          setPaused(false);
          stopStream();
        };
        mediaRecorder.current = mr;
        startedAt.current = Date.now();
        mr.start(250);
        setRecording(true);

        interval.current = window.setInterval(() => {
          setElapsed((Date.now() - startedAt.current) / 1000);
        }, 100);
      } catch (e) {
        setError((e as Error).message || "Couldn't access device");
        stopStream();
      }
    },
    [kind, stopStream],
  );

  const stop = useCallback(() => {
    if (interval.current) window.clearInterval(interval.current);
    interval.current = null;
    mediaRecorder.current?.stop();
  }, []);

  const reset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setElapsed(0);
    setError(null);
  }, [result]);

  return {
    recording,
    paused,
    elapsed,
    level,
    result,
    error,
    stream: stream.current,
    start,
    stop,
    reset,
  };
}

function pickMime(kind: "audio" | "video"): string | null {
  const candidates =
    kind === "audio"
      ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return null;
}
