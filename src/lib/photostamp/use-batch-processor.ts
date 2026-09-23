import { useCallback, useRef, useState } from "react";
import { renderStampedPhoto, type StampedFile } from "./render-full";
import { saveStampedFile } from "./save";
import type { BatchPhoto, StampSettings } from "./types";

export interface SkippedPhoto {
  name: string;
  reason: string;
}

export type ProcessStatus = "idle" | "running" | "done";

interface Progress {
  current: number;
  total: number;
  name: string;
  url: string;
}

const RENDER_TIMEOUT_MS = 60000;
const SAVE_TIMEOUT_MS = 90000;

/** Yields briefly without depending on requestAnimationFrame firing in Android WebView. */
function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    // This independent fallback is essential: a WebView may suspend animation
    // frames during a route transition even while timers continue to run.
    setTimeout(finish, 100);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(finish, 0));
    } else {
      setTimeout(finish, 0);
    }
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function useBatchProcessor() {
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0, name: "", url: "" });
  const [saved, setSaved] = useState<StampedFile[]>([]);
  const [skipped, setSkipped] = useState<SkippedPhoto[]>([]);
  const startedRef = useRef(false);

  const run = useCallback(
    async (photos: BatchPhoto[], settingsFor: (photo: BatchPhoto) => StampSettings) => {
      if (startedRef.current) return;
      startedRef.current = true;
      setStatus("running");
      setSaved([]);
      setSkipped([]);

      const done: StampedFile[] = [];
      const failed: SkippedPhoto[] = [];

      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        if (!photo) continue;
        setProgress({ current: i + 1, total: photos.length, name: photo.name, url: photo.url });
        // One photo per frame keeps memory flat and the UI interactive.
        await yieldToBrowser();
        try {
          console.info("PhotoStamp: STAMP_START", photo.name);
          const file = await withTimeout(
            renderStampedPhoto(photo, settingsFor(photo)),
            RENDER_TIMEOUT_MS,
            "Stamping timed out while creating the final JPEG",
          );
          console.info("PhotoStamp: JPEG_BLOB_COMPLETE", photo.name, file.blob.size);
          console.info("PhotoStamp: ANDROID_SAVE_START", photo.name);
          await withTimeout(
            saveStampedFile(file),
            SAVE_TIMEOUT_MS,
            "Saving timed out before the gallery operation completed",
          );
          console.info("PhotoStamp: ANDROID_SAVE_COMPLETE", photo.name);
          done.push(file);
        } catch (error) {
          console.error("PhotoStamp: STAMP_ERROR", photo.name, error);
          failed.push({
            name: photo.name,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      setSaved(done);
      setSkipped(failed);
      setProgress({ current: photos.length, total: photos.length, name: "", url: "" });
      setStatus("done");
    },
    [],
  );

  const reset = useCallback(() => {
    startedRef.current = false;
    setStatus("idle");
    setSaved([]);
    setSkipped([]);
  }, []);

  return { status, progress, saved, skipped, run, reset };
}
