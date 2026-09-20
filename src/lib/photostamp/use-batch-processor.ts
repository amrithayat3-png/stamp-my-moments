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

/** Yields to the browser so the progress UI stays responsive between photos. */
function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
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
        const photo = photos[i]!;
        setProgress({ current: i + 1, total: photos.length, name: photo.name, url: photo.url });
        // One photo per frame keeps memory flat and the UI interactive.
        await yieldToBrowser();
        try {
          const file = await renderStampedPhoto(photo, settingsFor(photo));
          await saveStampedFile(file);
          done.push(file);
        } catch (error) {
          console.error("PhotoStamp: skipped a photo", photo.name, error);
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
