import type { BatchPhoto } from "./types";

export interface DecodedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

function looksHeic(blob: Blob | null, url: string) {
  const type = blob?.type ?? "";
  return /hei[cf]/i.test(type) || /\.hei[cf](\?|$)/i.test(url);
}

/** iPhone/Android HEIC photos: browsers can't decode them, so convert first. */
async function heicToBitmapSource(blob: Blob): Promise<Blob | null> {
  try {
    const { heicTo } = await import("heic-to");
    return await heicTo({ blob, type: "image/jpeg", quality: 0.95 });
  } catch {
    return null;
  }
}

async function sourceBlob(photo: Pick<BatchPhoto, "url" | "file">): Promise<Blob | null> {
  if (photo.file) return photo.file;
  try {
    const res = await fetch(photo.url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

/** EXIF orientation value, or 1 when unknown. Read from the raw bytes. */
async function readOrientation(blob: Blob): Promise<number> {
  try {
    const exifr = await import("exifr");
    const data = await exifr.parse(blob, { pick: ["Orientation"], translateValues: false });
    const value = Number((data as any)?.Orientation);
    return Number.isFinite(value) && value >= 1 && value <= 8 ? value : 1;
  } catch {
    return 1;
  }
}

/**
 * Decodes an <img> without setting crossOrigin. Setting crossOrigin on a
 * blob: URL makes some Android WebViews and older Safari versions refuse the
 * load outright, which is why full-resolution rendering could fail on real
 * camera photos even though metadata parsed fine.
 */
function decodeElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "sync";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("This photo's format isn't supported by the browser (try JPEG or PNG)"));
    img.src = url;
  });
}

function orientedSize(w: number, h: number, orientation: number) {
  return orientation >= 5 ? { width: h, height: w } : { width: w, height: h };
}

function applyOrientation(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  w: number,
  h: number,
) {
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, w, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, w, h);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, h);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, w, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, w, h);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, h);
      break;
    default:
      break;
  }
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available on this device");
  return { canvas, ctx };
}

/**
 * Decodes a photo into a canvas with EXIF rotation already applied and the
 * longest edge capped at maxEdge. Tries createImageBitmap first (handles
 * rotation and wide-gamut profiles natively), then falls back to an <img>
 * element with manual rotation.
 */
export async function decodeToCanvas(
  photo: Pick<BatchPhoto, "url" | "file">,
  maxEdge: number,
): Promise<DecodedImage> {
  let blob = await sourceBlob(photo);
  let objectUrl: string | null = null;

  if (blob && looksHeic(blob, photo.url)) {
    const converted = await heicToBitmapSource(blob);
    if (converted) blob = converted;
  }

  if (blob && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const { canvas, ctx } = makeCanvas(width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      return { canvas, width, height };
    } catch {
      // Fall through to the element-based path.
    }
  }

  const orientation = blob ? await readOrientation(blob) : 1;
  const img = await decodeElement(photo.url);
  const natural = orientedSize(img.naturalWidth, img.naturalHeight, orientation);
  if (!natural.width || !natural.height) {
    throw new Error("This photo could not be decoded");
  }
  const scale = Math.min(1, maxEdge / Math.max(natural.width, natural.height));
  const width = Math.max(1, Math.round(natural.width * scale));
  const height = Math.max(1, Math.round(natural.height * scale));
  const { canvas, ctx } = makeCanvas(width, height);
  applyOrientation(ctx, orientation, width, height);
  const drawW = orientation >= 5 ? height : width;
  const drawH = orientation >= 5 ? width : height;
  ctx.drawImage(img, 0, 0, drawW, drawH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, width, height };
}
