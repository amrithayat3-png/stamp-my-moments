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

/** Loads the native Media plugin only inside the Capacitor shell. */
async function nativeMedia() {
  if (!isNativeShell()) return undefined;
  try {
    const mod = await import("@capacitor-community/media");
    return mod.Media;
  } catch {
    return undefined;
  }
}

/**
 * Finds the PhotoStamp album, creating it when missing, and returns its
 * identifier (required on Android by Media.savePhoto).
 */
async function photoStampAlbumIdentifier(media: any): Promise<string | undefined> {
  const find = async () => {
    const existing = await media.getAlbums();
    const albums: any[] = existing?.albums ?? [];
    let path: string | undefined;
    try {
      path = (await media.getAlbumsPath?.())?.path;
    } catch {
      path = undefined;
    }
    const matches = albums.filter((a) => a.name === ALBUM_NAME);
    const preferred = path
      ? matches.find((a) => String(a.identifier ?? "").startsWith(path))
      : undefined;
    return (preferred ?? matches[0])?.identifier as string | undefined;
  };

  let identifier = await find();
  if (identifier) return identifier;
  try {
    await media.createAlbum({ name: ALBUM_NAME });
  } catch {
    // Album may already exist under a different path — fall through to lookup.
  }
  identifier = await find();
  return identifier;
}

/**
 * Saves one stamped file. Native: MediaStore-backed write into
 * Pictures/PhotoStamp. Web: a normal browser download.
 * Source images are never modified or removed.
 */
export async function saveStampedFile(file: StampedFile): Promise<void> {
  const media = await nativeMedia();
  if (media) {
    const base64 = await blobToBase64(file.blob);
    // Android expects the file name without an extension.
    const fileName = file.name.replace(/\.[^.]+$/, "");
    const albumIdentifier = await photoStampAlbumIdentifier(media);
    await media.savePhoto({
      path: `data:image/jpeg;base64,${base64}`,
      fileName,
      ...(albumIdentifier ? { albumIdentifier } : {}),
    });
    return;
  }

  const p = plugins();
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
