import type { BatchPhoto } from "./types";
import { isNativeShell, requestGalleryPermission } from "./permissions";
import { readCaptureDate } from "./exif";

let counter = 0;
function nextId() {
  counter += 1;
  return `photo-${Date.now()}-${counter}`;
}

function base(name: string, url: string, size: number, file?: Blob): BatchPhoto {
  return {
    id: nextId(),
    name: name || "photo.jpg",
    url,
    file,
    size,
    captureDate: null,
    dateSource: "none",
    status: "date-needed",
    override: null,
  };
}

/**
 * Reads the EXIF capture date for each photo. Photos without one keep
 * captureDate = null so the user is asked explicitly — never a file timestamp.
 */
async function withCaptureDates(photos: BatchPhoto[], blobs: (Blob | string)[]) {
  return Promise.all(
    photos.map(async (photo, i) => {
      const captureDate = await readCaptureDate(blobs[i]!);
      return captureDate
        ? { ...photo, captureDate, dateSource: "exif" as const, status: "ready" as const }
        : photo;
    }),
  );
}

function pickWithInput(): Promise<BatchPhoto[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.style.display = "none";
    input.addEventListener("change", async () => {
      const files = Array.from(input.files ?? []);
      input.remove();
      const photos = files.map((f) => base(f.name, URL.createObjectURL(f), f.size));
      resolve(await withCaptureDates(photos, files));
    });
    input.addEventListener("cancel", () => {
      input.remove();
      resolve([]);
    });
    document.body.appendChild(input);
    input.click();
  });
}

async function pickWithCapacitor(): Promise<BatchPhoto[]> {
  const gallery = (window as any).Capacitor?.Plugins?.['Camera'];
  const result = await gallery.pickImages({ quality: 90 });
  const raw: any[] = result?.photos ?? [];
  const photos = raw.map((p) =>
    base((p.path ?? p.webPath ?? "photo.jpg").split("/").pop() || "photo.jpg", p.webPath ?? p.path, 0),
  );
  const blobs = await Promise.all(
    photos.map(async (p) => {
      try {
        return await (await fetch(p.url)).blob();
      } catch {
        return p.url;
      }
    }),
  );
  return withCaptureDates(photos, blobs);
}

/** Opens the gallery and returns the chosen photos (empty array when cancelled). */
export async function pickPhotos(): Promise<BatchPhoto[]> {
  if (isNativeShell() && (window as any).Capacitor?.Plugins?.['Camera']?.pickImages) {
    const state = await requestGalleryPermission();
    if (state === "denied") return [];
    try {
      return await pickWithCapacitor();
    } catch {
      return [];
    }
  }
  return pickWithInput();
}
