import { useCallback, useEffect, useState } from "react";

const LS_CAM = "luminary-media-camera";
const LS_MIC = "luminary-media-mic";

function loadStored(id: string): string {
  try {
    return localStorage.getItem(id) ?? "";
  } catch {
    return "";
  }
}

function saveStored(id: string, value: string) {
  try {
    localStorage.setItem(id, value);
  } catch {
    /* ignore */
  }
}

export function useMediaDevices() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCameraState] = useState("");
  const [selectedMic, setSelectedMicState] = useState("");

  const setSelectedCamera = useCallback((id: string) => {
    setSelectedCameraState(id);
    if (id) saveStored(LS_CAM, id);
  }, []);

  const setSelectedMic = useCallback((id: string) => {
    setSelectedMicState(id);
    if (id) saveStored(LS_MIC, id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const enumerate = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
          } catch {
            /* still enumerate — labels may stay empty */
          }
        }
      }
      if (cancelled) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        const audioDevices = devices.filter((d) => d.kind === "audioinput");
        setCameras(videoDevices);
        setMics(audioDevices);

        const storedCam = loadStored(LS_CAM);
        const storedMic = loadStored(LS_MIC);
        const cam =
          videoDevices.find((d) => d.deviceId === storedCam)?.deviceId ??
          videoDevices[0]?.deviceId ??
          "";
        const mic =
          audioDevices.find((d) => d.deviceId === storedMic)?.deviceId ??
          audioDevices[0]?.deviceId ??
          "";
        setSelectedCameraState(cam);
        setSelectedMicState(mic);
      } catch {
        setCameras([]);
        setMics([]);
      }
    };

    void enumerate();
    navigator.mediaDevices.addEventListener("devicechange", enumerate);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener("devicechange", enumerate);
    };
  }, []);

  return {
    cameras,
    mics,
    selectedCamera,
    selectedMic,
    setSelectedCamera,
    setSelectedMic,
  };
}
