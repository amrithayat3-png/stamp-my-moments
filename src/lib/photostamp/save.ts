import { isNativeShell } from "./permissions";
import type { StampedFile } from "./render-full";

export const ALBUM_NAME = "PhotoStamp";
export const ALBUM_PATH = "Pictures/PhotoStamp";

function plugins(): Record<string, any> | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).Capacitor?.Plugins;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the stamped photo"));
    reader.readAsDataURL(blob);
  });
}

let albumReady = false;

/**
 * Ensures the dedicated PhotoStamp album exists (native only).
 * Safe to call repeatedly; a duplicate album error is ignored.
 */
async function ensureAlbum() {
  if (albumReady) return;
  const media = plugins()?.['Media'];
  if (!media?.createAlbum) {
    albumReady = true;
    return;
  }
  try {
    const existing = await media.getAlbums?.();
    const found = (existing?.albums ?? []).some((a: any) => a.name === ALBUM_NAME);
    if (!found) await media.createAlbum({ name: ALBUM_NAME });
  } catch {
    // Album may already exist, or the plugin refuses duplicates — keep going.
  }
  albumReady = true;
}

async function albumIdentifier(): Promise<string | undefined> {
  const media = plugins()?.['Media'];
  try {
    const existing = await media?.getAlbums?.();
    const match = (existing?.albums ?? []).find((a: any) => a.name === ALBUM_NAME);
    return match?.identifier;
  } catch {
    return undefined;
  }
}

/**
 * Saves one stamped file. Native: MediaStore-backed write into
 * Pictures/PhotoStamp. Web: a normal browser download.
 * Source images are never modified or removed.
 */
export async function saveStampedFile(file: StampedFile): Promise<void> {
  const p = plugins();
  if (isNativeShell() && p?.['Media']?.savePhoto) {
    await ensureAlbum();
    const base64 = await blobToBase64(file.blob);
    await p['Media'].savePhoto({
      path: `data:image/jpeg;base64,${base64}`,
      album: ALBUM_NAME,
      albumIdentifier: await albumIdentifier(),
      fileName: file.name,
    });
    return;
  }

  if (isNativeShell() && p?.['Filesystem']?.writeFile) {
    // Fallback: scoped-storage compliant write into the public Pictures dir.
    const base64 = await blobToBase64(file.blob);
    await p['Filesystem'].writeFile({
      path: `${ALBUM_PATH}/${file.name}`,
      data: base64,
      directory: "EXTERNAL_STORAGE",
      recursive: true,
    });
    return;
  }

  downloadFile(file);
}

export function downloadFile(file: StampedFile) {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadZip(files: StampedFile[]) {
  const { zipSync } = await import("fflate");
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    entries[file.name] = new Uint8Array(await file.blob.arrayBuffer());
  }
  const zipped = zipSync(entries, { level: 0 });
  const blob = new Blob([zipped.slice().buffer as ArrayBuffer], { type: "application/zip" });
  downloadFile({ name: "photostamp-batch.zip", blob });
}

/** Shares the stamped photos through the native or Web Share sheet. */
export async function shareStamped(files: StampedFile[]): Promise<"shared" | "unsupported"> {
  const p = plugins();
  if (isNativeShell() && p?.['Share']?.share && p?.['Filesystem']?.writeFile) {
    const first = files[0];
    if (!first) return "unsupported";
    const base64 = await blobToBase64(first.blob);
    const written = await p['Filesystem'].writeFile({
      path: `${ALBUM_PATH}/${first.name}`,
      data: base64,
      directory: "EXTERNAL_STORAGE",
      recursive: true,
    });
    await p['Share'].share({ title: "Stamped with PhotoStamp", url: written?.uri ?? undefined });
    return "shared";
  }

  const shareFiles = files.map((f) => new File([f.blob], f.name, { type: "image/jpeg" }));
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: shareFiles }) &&
    navigator.share
  ) {
    await navigator.share({ files: shareFiles, title: "Stamped with PhotoStamp" });
    return "shared";
  }
  return "unsupported";
}

export function isNativeSave() {
  return isNativeShell();
}
