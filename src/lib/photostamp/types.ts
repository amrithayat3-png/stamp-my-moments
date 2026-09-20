export type PhotoStatus = "ready" | "date-needed";

export interface BatchPhoto {
  id: string;
  name: string;
  /** Blob/object URL used for thumbnails and previews. */
  url: string;
  /** Original file data, kept so rendering never depends on refetching the URL. */
  file?: Blob;
  size: number;
  /** Capture date from EXIF or manual entry, as an ISO-ish local string (yyyy-MM-ddTHH:mm). */
  captureDate: string | null;
  /** Where the date came from. */
  dateSource: "exif" | "manual" | "none";
  status: PhotoStatus;
  /** Per-photo overrides of the batch-wide stamp settings. */
  override?: Partial<StampSettings> | null;
}

export type StampCorner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

export interface StampSettings {
  fontId: string;
  colorHex: string;
  /** Stamp height as a percentage of the image's shorter side. */
  sizePct: number;
  corner: StampCorner;
  /** Inset from the edges as a percentage of the shorter side. */
  insetPct: number;
  formatId: string;
  hour24: boolean;
  shadow: boolean;
}

export const DEFAULT_STAMP: StampSettings = {
  fontId: "sans",
  colorHex: "#FFB020",
  sizePct: 4,
  corner: "bottom-left",
  insetPct: 4,
  formatId: "ymd-hm",
  hour24: true,
  shadow: true,
};
