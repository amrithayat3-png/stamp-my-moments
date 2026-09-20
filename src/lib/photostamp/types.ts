export type PhotoStatus = "ready" | "date-needed";

export interface BatchPhoto {
  id: string;
  name: string;
  /** Blob/object URL used for thumbnails and previews. */
  url: string;
  size: number;
  /** Capture date resolved in Phase 2 (EXIF). Null means the user must pick one. */
  captureDate: string | null;
  status: PhotoStatus;
}
