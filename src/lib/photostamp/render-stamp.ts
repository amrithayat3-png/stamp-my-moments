import { getFont } from "./stamp-options";
import { formatStampText } from "./stamp-options";
import type { StampSettings } from "./types";

/** Draws the stamp onto a canvas that already contains the image at full size. */
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  settings: StampSettings,
) {
  if (!text) return;
  const shortSide = Math.min(width, height);
  const fontSize = Math.max(8, (settings.sizePct / 100) * shortSide);
  const inset = (settings.insetPct / 100) * shortSide;
  const font = getFont(settings.fontId);

  ctx.save();
  ctx.font = `${font.weight} ${fontSize}px ${font.stack}`;
  ctx.fillStyle = settings.colorHex;
  ctx.textBaseline = settings.corner.startsWith("top") ? "top" : "alphabetic";
  ctx.textAlign = settings.corner.endsWith("right") ? "right" : "left";

  if (settings.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = fontSize * 0.25;
    ctx.shadowOffsetY = fontSize * 0.06;
  }

  const x = settings.corner.endsWith("right") ? width - inset : inset;
  const y = settings.corner.startsWith("top") ? inset : height - inset;

  const spacing = font.letterSpacing * fontSize;
  if (spacing > 0) {
    // Manual letter spacing for wide-tracking fonts.
    const chars = [...text];
    const total =
      chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
    let cursor = ctx.textAlign === "right" ? x - total : x;
    ctx.textAlign = "left";
    for (const c of chars) {
      ctx.fillText(c, cursor, y);
      cursor += ctx.measureText(c).width + spacing;
    }
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

export function stampTextFor(
  captureDate: string | null,
  settings: StampSettings,
): string {
  return formatStampText(captureDate, settings.formatId, settings.hour24);
}

/**
 * Samples the region where the stamp will sit and suggests white or black
 * for maximum contrast.
 */
export function suggestContrastColor(
  canvas: HTMLCanvasElement,
  settings: StampSettings,
): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#FFFFFF";
  const w = canvas.width;
  const h = canvas.height;
  const boxW = Math.max(1, Math.floor(w * 0.45));
  const boxH = Math.max(1, Math.floor(h * 0.18));
  const x = settings.corner.endsWith("right") ? w - boxW : 0;
  const y = settings.corner.startsWith("top") ? 0 : h - boxH;
  try {
    const { data } = ctx.getImageData(x, y, boxW, boxH);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 16) {
      sum += 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
      count += 1;
    }
    const luminance = count ? sum / count : 128;
    return luminance > 140 ? "#141414" : "#FFFFFF";
  } catch {
    return "#FFFFFF";
  }
}
