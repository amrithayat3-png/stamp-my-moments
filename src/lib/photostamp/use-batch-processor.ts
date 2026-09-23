import { useCallback, useRef, useState } from "react";
import { renderStampedPhoto, type StampedFile } from "./render-full";
import { saveStampedFile } from "./save";
import type { BatchPhoto, StampSettings } from "./types";

export type DiagnosticStage =
  | "STAMP_100_REACHED"
  | "YIELD_COMPLETE"
  | "IMAGE_RENDER_COMPLETE"
  | "JPEG_BLOB_COMPLETE"
  | "JPEG_FILE_COMPLETE"
  | "SAVE_HANDOFF_STARTED"
  | "SAVE_HANDOFF_COMPLETE"
  | "BATCH_COMPLETE";

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
  stage: DiagnosticStage | "";
}

const RENDER_TIMEOUT_MS = 60000;
const SAVE_TIMEOUT_MS = 90000;
const PHOTO_TIMEOUT_MS = 120000;

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

function abortError(stage: DiagnosticStage) {
  return new Error(`Photo timed out at ${stage}`);
}

export function useBatchProcessor() {
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState<Progress>({
    current: 0,
    total: 0,
    name: "",
    url: "",
    stage: "",
  });
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

      const report = (stage: DiagnosticStage, photo: BatchPhoto) => {
        console.info(`PhotoStamp: ${stage}`, photo.name);
        setProgress((value) => ({ ...value, stage }));
      };

      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        if (!photo) continue;
        let activeStage: DiagnosticStage = "STAMP_100_REACHED";
        const controller = new AbortController();
        const stage = (nextStage: DiagnosticStage) => {
          if (controller.signal.aborted) return;
          activeStage = nextStage;
          report(nextStage, photo);
        };
        setProgress({
          current: i + 1,
          total: photos.length,
          name: photo.name,
          url: photo.url,
          stage: activeStage,
        });
        console.info("PhotoStamp: STAMP_100_REACHED", photo.name);
        try {
          const operation = (async () => {
            await yieldToBrowser();
            if (controller.signal.aborted) throw abortError(activeStage);
            stage("YIELD_COMPLETE");

            const file = await withTimeout(
              renderStampedPhoto(photo, settingsFor(photo), stage),
              RENDER_TIMEOUT_MS,
              "Stamping timed out while creating the final JPEG",
            );
            if (controller.signal.aborted) throw abortError(activeStage);
            stage("JPEG_BLOB_COMPLETE");
            console.info("PhotoStamp: JPEG_BLOB_SIZE", photo.name, file.blob.size);

            await withTimeout(
              saveStampedFile(file, stage),
              SAVE_TIMEOUT_MS,
              "Saving timed out before the gallery operation completed",
            );
            if (controller.signal.aborted) throw abortError(activeStage);
            stage("SAVE_HANDOFF_COMPLETE");
            return file;
          })();

          const file = await new Promise<StampedFile>((resolve, reject) => {
            const timer = setTimeout(() => {
              controller.abort();
              const error = abortError(activeStage);
              console.error("PhotoStamp: STAMP_TIMEOUT", photo.name, activeStage, error);
              reject(error);
            }, PHOTO_TIMEOUT_MS);
            operation.then(
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
          done.push(file);
        } catch (error) {
          console.error("PhotoStamp: STAMP_ERROR", photo.name, activeStage, error);
          failed.push({
            name: photo.name,
            reason:
              error instanceof Error
                ? `${activeStage}: ${error.message}`
                : `${activeStage}: Unknown error`,
          });
        }
      }

      setSaved(done);
      setSkipped(failed);
      console.info("PhotoStamp: BATCH_COMPLETE", { saved: done.length, failed: failed.length });
      setProgress({
        current: photos.length,
        total: photos.length,
        name: "",
        url: "",
        stage: "BATCH_COMPLETE",
      });
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
