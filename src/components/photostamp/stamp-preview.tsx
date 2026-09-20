import { useEffect, useRef, useState } from "react";
import { decodeToCanvas } from "@/lib/photostamp/load-image";
import { drawStamp, stampTextFor } from "@/lib/photostamp/render-stamp";
import type { StampSettings } from "@/lib/photostamp/types";

interface Props {
  url: string;
  file?: Blob | undefined;
  captureDate: string | null;
  settings: StampSettings;
  /** Receives the canvas after each render so callers can sample pixels. */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function StampPreview({ url, file, captureDate, settings, onCanvasReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    baseRef.current = null;
    // Preview at a capped size so phones stay smooth; geometry matches the
    // full-size render because everything is relative to the shorter side.
    decodeToCanvas({ url, file }, 1600)
      .then((decoded) => {
        if (cancelled) return;
        baseRef.current = decoded.canvas;
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [url, file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const base = baseRef.current;
    if (!canvas || !base || state !== "ready") return;
    canvas.width = base.width;
    canvas.height = base.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    drawStamp(
      ctx,
      canvas.width,
      canvas.height,
      stampTextFor(captureDate, settings),
      settings,
    );
    onCanvasReady?.(canvas);
  }, [state, captureDate, settings, onCanvasReady]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary">
      <canvas ref={canvasRef} className="block h-auto w-full" />
      {state === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Loading preview…
        </div>
      ) : null}
      {state === "error" ? (
        <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-xs text-muted-foreground">
          This photo can't be shown here. It may be in a format the browser can't open.
        </div>
      ) : null}
      {state === "ready" && !captureDate ? (
        <div className="absolute inset-x-0 bottom-0 bg-warning/90 px-4 py-2 text-center text-xs font-semibold text-warning-foreground">
          No capture date yet — set one to see the stamp
        </div>
      ) : null}
    </div>
  );
}
