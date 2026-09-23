import { isNativeShell } from "./permissions";
import type { StampedFile } from "./render-full";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Media, type MediaAlbum, type MediaPlugin } from "@capacitor-community/media";

export const ALBUM_NAME = "PhotoStamp";
export const ALBUM_PATH = "Pictures/PhotoStamp";

export type NativeSaveStage =
  | "BASE64_CONVERSION_START"
  | "BASE64_CONVERSION_COMPLETE"
  | "TEMP_FILE_WRITE_START"
  | "TEMP_FILE_WRITE_COMPLETE"
  | "JPEG_FILE_COMPLETE"
  | "SAVE_HANDOFF_STARTED";
export type NativeSaveStageReporter = (stage: NativeSaveStage) => void;

interface LegacyPlugin {
  writeFile?: (options: Record<string, unknown>) => Promise<{ uri?: string }>;
  share?: (options: Record<string, unknown>) => Promise<unknown>;
}

function plugins(): Record<string, LegacyPlugin> | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Capacitor?: { Plugins?: Record<string, LegacyPlugin> } }).Capacitor
    ?.Plugins;
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

/** Returns the bundled native plugin proxy only inside the Capacitor shell. */
function nativeMedia() {
  return isNativeShell() ? Media : undefined;
}

/** Rejects with a readable message if a native call never settles. */
function withTimeout<T>(operation: () => Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${what} timed out — the photo could not be saved`)),
      ms,
    );
    let promise: Promise<T>;
    try {
      promise = operation();
    } catch (error) {
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(`${what} failed`));
      return;
    }
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e?.message ?? e ?? `${what} failed`)));
      },
    );
  });
}

function normalizePath(value: unknown): string {
  return String(value ?? "")
    .replace(/^file:\/\//, "")
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
}

function matchingAlbum(albums: MediaAlbum[], albumsPath: string) {
  const base = normalizePath(albumsPath).toLowerCase();
  return albums.find((album) => {
    if (String(album?.name ?? "").toLowerCase() !== ALBUM_NAME.toLowerCase()) return false;
    const identifier = normalizePath(album?.identifier).toLowerCase();
    return (
      identifier === `${base}/${ALBUM_NAME.toLowerCase()}` || identifier.startsWith(`${base}/`)
    );
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Resolves the verified identifier returned by Media.getAlbums(). */
async function photoStampAlbumIdentifier(media: MediaPlugin): Promise<string> {
  const pathResult = await withTimeout(
    () => media.getAlbumsPath(),
    10000,
    "Finding the gallery album folder",
  );
  const albumsPath = String(pathResult?.path ?? "");
  if (!normalizePath(albumsPath)) throw new Error("The gallery album folder was not available");

  const readAlbums = async () => {
    const result = await withTimeout(() => media.getAlbums(), 10000, "Reading gallery albums");
    return Array.isArray(result?.albums) ? result.albums : [];
  };

  let album = matchingAlbum(await readAlbums(), albumsPath);
  if (!album) {
    await withTimeout(
      () => media.createAlbum({ name: ALBUM_NAME }),
      10000,
      "Creating the PhotoStamp album",
    );

    // MediaStore may publish a newly-created album asynchronously. Re-read it
    // instead of constructing an identifier that the plugin has not verified.
    for (let attempt = 0; attempt < 4 && !album; attempt += 1) {
      if (attempt > 0) await wait(500);
      album = matchingAlbum(await readAlbums(), albumsPath);
    }
  }

  const identifier = String(album?.identifier ?? "");
  if (!identifier) throw new Error("The PhotoStamp album could not be verified after creation");
  return identifier;
}

function uniqueFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "_") || "photo_stamped";
  return `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function saveNativePhoto(
  media: MediaPlugin,
  file: StampedFile,
  reportStage?: NativeSaveStageReporter,
): Promise<void> {
  const fileName = uniqueFileName(file.name);
  const tempPath = `photostamp/${fileName}.jpg`;
  reportStage?.("BASE64_CONVERSION_START");
  const base64 = await withTimeout(() => blobToBase64(file.blob), 15000, "Preparing the photo");
  reportStage?.("BASE64_CONVERSION_COMPLETE");

  reportStage?.("TEMP_FILE_WRITE_START");
  await withTimeout(
    () =>
      Filesystem.writeFile({
        path: tempPath,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      }),
    20000,
    "Writing the temporary photo",
  );
  reportStage?.("TEMP_FILE_WRITE_COMPLETE");
  reportStage?.("JPEG_FILE_COMPLETE");

  try {
    const uriResult = await withTimeout(
      () => Filesystem.getUri({ path: tempPath, directory: Directory.Cache }),
      10000,
      "Locating the temporary photo",
    );
    if (!uriResult.uri) throw new Error("The temporary photo path was not available");

    const albumIdentifier = await photoStampAlbumIdentifier(media);
    reportStage?.("SAVE_HANDOFF_STARTED");
    await withTimeout(
      () => media.savePhoto({ path: uriResult.uri, fileName, albumIdentifier }),
      30000,
      "Saving the photo to the gallery",
    );
  } finally {
    try {
      await withTimeout(
        () => Filesystem.deleteFile({ path: tempPath, directory: Directory.Cache }),
        10000,
        "Cleaning up the temporary photo",
      );
    } catch (error) {
      console.warn("PhotoStamp: could not remove temporary photo", error);
    }
  }
}

/**
 * Saves one stamped file. Native: MediaStore-backed write into
 * Pictures/PhotoStamp. Web: a normal browser download.
 * Source images are never modified or removed.
 */
export async function saveStampedFile(
  file: StampedFile,
  reportStage?: NativeSaveStageReporter,
): Promise<void> {
  const media = nativeMedia();
  if (media) {
    await saveNativePhoto(media, file, reportStage);
    return;
  }

  const p = plugins();
  if (isNativeShell() && p?.["Filesystem"]?.writeFile) {
    // Fallback: scoped-storage compliant write into the public Pictures dir.
    const base64 = await blobToBase64(file.blob);
    await p["Filesystem"].writeFile({
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
  if (isNativeShell() && p?.["Share"]?.share && p?.["Filesystem"]?.writeFile) {
    const first = files[0];
    if (!first) return "unsupported";
    const base64 = await blobToBase64(first.blob);
    const written = await p["Filesystem"].writeFile({
      path: `${ALBUM_PATH}/${first.name}`,
      data: base64,
      directory: "EXTERNAL_STORAGE",
      recursive: true,
    });
    await p["Share"].share({ title: "Stamped with PhotoStamp", url: written?.uri ?? undefined });
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
