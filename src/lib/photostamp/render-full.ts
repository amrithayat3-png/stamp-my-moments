import { drawStamp, stampTextFor } from "./render-stamp";
import type { BatchPhoto, StampSettings } from "./types";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode this image"));
    img.src = url;
  });
}

export interface StampedFile {
  name: string;
  blob: Blob;
}

function outputName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}_stamped.jpg`;
}

/**
 * Renders one photo at full resolution with its stamp burned in.
 * Originals are never touched — this always produces a new JPEG blob.
 */
export async function renderStampedPhoto(
  photo: BatchPhoto,
  settings: StampSettings,
): Promise<StampedFile> {
  const img = await loadImage(photo.url);
  // Guard against OOM on very large photos while keeping print-quality output.
  const maxEdge = 4096;
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable on this device");
  ctx.drawImage(img, 0, 0, w, h);
  drawStamp(ctx, w, h, stampTextFor(photo.captureDate, settings), settings);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
  );
  // Free the backing store as soon as possible.
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error("Could not encode the stamped photo");
  return { name: outputName(photo.name), blob };
}
