import type { BatchPhoto } from "./types";
import { isNativeShell, requestGalleryPermission } from "./permissions";

let counter = 0;
function nextId() {
  counter += 1;
  return `photo-${Date.now()}-${counter}`;
}

function fromFile(file: File): BatchPhoto {
  return {
    id: nextId(),
    name: file.name || "photo.jpg",
    url: URL.createObjectURL(file),
    size: file.size,
    captureDate: null,
    status: "date-needed",
  };
}

function pickWithInput(): Promise<BatchPhoto[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.style.display = "none";
    input.addEventListener("change", () => {
      const files = Array.from(input.files ?? []);
      input.remove();
      resolve(files.map(fromFile));
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
  const gallery = (window as any).Capacitor?.Plugins?.Camera;
  const result = await gallery.pickImages({ quality: 90 });
  const photos: BatchPhoto[] = (result?.photos ?? []).map((p: any) => ({
    id: nextId(),
    name: (p.path ?? p.webPath ?? "photo.jpg").split("/").pop() || "photo.jpg",
    url: p.webPath ?? p.path,
    size: 0,
    captureDate: null,
    status: "date-needed" as const,
  }));
  return photos;
}

/** Opens the gallery and returns the chosen photos (empty array when cancelled). */
export async function pickPhotos(): Promise<BatchPhoto[]> {
  if (isNativeShell() && (window as any).Capacitor?.Plugins?.Camera?.pickImages) {
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
