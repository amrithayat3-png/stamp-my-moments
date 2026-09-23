import { decodeToCanvas } from "./load-image";
import { drawStamp, stampTextFor } from "./render-stamp";
import type { BatchPhoto, StampSettings } from "./types";

export interface StampedFile {
  name: string;
  blob: Blob;
}

function outputName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}_stamped.jpg`;
}

const JPEG_ENCODE_TIMEOUT_MS = 20000;

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Creating the final JPEG timed out"));
    }, JPEG_ENCODE_TIMEOUT_MS);

    try {
      canvas.toBlob(
        (blob) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(blob);
        },
        "image/jpeg",
        quality,
      );
    } catch (error) {
      settled = true;
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error("Creating the final JPEG failed"));
    }
  });
}

// Progressively smaller working sizes: phones with little free memory fail to
// allocate the canvas or return a null blob at full camera resolution.
const EDGE_STEPS = [4096, 3072, 2048, 1440];

/**
 * Renders one photo with its stamp burned in and returns a new JPEG blob.
 * Originals are never modified.
 */
export async function renderStampedPhoto(
  photo: BatchPhoto,
  settings: StampSettings,
): Promise<StampedFile> {
  let lastError: unknown = null;

  for (const maxEdge of EDGE_STEPS) {
    let canvas: HTMLCanvasElement | null = null;
    try {
      const decoded = await decodeToCanvas(photo, maxEdge);
      canvas = decoded.canvas;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas isn't available on this device");
      drawStamp(
        ctx,
        decoded.width,
        decoded.height,
        stampTextFor(photo.captureDate, settings),
        settings,
      );
      const blob = (await encode(canvas, 0.92)) ?? (await encode(canvas, 0.8));
      if (!blob || blob.size === 0) throw new Error("Not enough memory to save this photo");
      return { name: outputName(photo.name), blob };
    } catch (error) {
      lastError = error;
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("This photo could not be stamped");
}
