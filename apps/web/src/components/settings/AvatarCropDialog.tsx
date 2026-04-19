import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  if (pixelCrop.width < 200 || pixelCrop.height < 200) {
    throw new Error("Crop must be at least 200×200 pixels. Zoom out or use a larger image.");
  }
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not read image"));
        else resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function AvatarCropDialog({
  open,
  imageSrc,
  onOpenChange,
  onCropped,
}: {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onCropped(blob);
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't crop image";
      toast.error("Crop failed", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop profile photo</DialogTitle>
        </DialogHeader>
        {imageSrc && (
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-active">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}
        <div className="space-y-2 px-1">
          <label className="text-xs text-secondary">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={busy || !imageSrc}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
