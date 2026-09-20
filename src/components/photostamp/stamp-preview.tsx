import { useEffect, useRef, useState } from "react";
import { drawStamp, stampTextFor } from "@/lib/photostamp/render-stamp";
import type { StampSettings } from "@/lib/photostamp/types";

interface Props {
  url: string;
  captureDate: string | null;
  settings: StampSettings;
  /** Receives the canvas after each render so callers can sample pixels. */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function StampPreview({ url, captureDate, settings, onCanvasReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setLoaded(true);
    };
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !loaded) return;
    // Cap the working resolution so previews stay smooth on phones while
    // keeping the stamp geometry identical to a full-size render.
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    drawStamp(ctx, w, h, stampTextFor(captureDate, settings), settings);
    onCanvasReady?.(canvas);
  }, [loaded, captureDate, settings, onCanvasReady]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary">
      <canvas ref={canvasRef} className="block h-auto w-full" />
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Loading preview…
        </div>
      ) : null}
      {!captureDate ? (
        <div className="absolute inset-x-0 bottom-0 bg-warning/90 px-4 py-2 text-center text-xs font-semibold text-warning-foreground">
          No capture date yet — set one to see the stamp
        </div>
      ) : null}
    </div>
  );
}
