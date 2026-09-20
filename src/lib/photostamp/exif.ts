/**
 * EXIF capture-date extraction.
 *
 * Strict rule: only DateTimeOriginal (preferred) or DateTime are accepted.
 * File creation / last-modified timestamps are NEVER used as a fallback —
 * they are wrong for downloaded or re-saved media.
 */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local datetime string in the shape a datetime-local input expects. */
export function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function isValid(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime()) && date.getFullYear() > 1900;
}

export async function readCaptureDate(source: Blob | string): Promise<string | null> {
  try {
    const exifr = await import("exifr");
    const tags = await exifr.parse(source as any, {
      tiff: true,
      exif: true,
      pick: ["DateTimeOriginal", "CreateDate", "DateTime", "ModifyDate"],
    });
    if (!tags) return null;
    // DateTimeOriginal first, then the EXIF DateTime tag (exifr surfaces it as
    // CreateDate / DateTime / ModifyDate depending on the file).
    const candidate =
      tags.DateTimeOriginal ?? tags.CreateDate ?? tags.DateTime ?? tags.ModifyDate ?? null;
    if (!isValid(candidate)) return null;
    return toLocalInputValue(candidate);
  } catch {
    return null;
  }
}
