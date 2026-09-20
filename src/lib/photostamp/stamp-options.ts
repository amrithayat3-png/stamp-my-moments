import type { StampCorner } from "./types";

export interface FontOption {
  id: string;
  label: string;
  /** CSS font stack used for both preview and canvas rendering. */
  stack: string;
  weight: number;
  letterSpacing: number;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "sans",
    label: "Clean Modern Sans",
    stack: '"Manrope", system-ui, sans-serif',
    weight: 600,
    letterSpacing: 0,
  },
  {
    id: "lcd",
    label: "Classic Digital",
    stack: '"Share Tech Mono", "Courier New", monospace',
    weight: 400,
    letterSpacing: 0.02,
  },
  {
    id: "mono",
    label: "Monospace",
    stack: '"JetBrains Mono", ui-monospace, monospace',
    weight: 500,
    letterSpacing: 0,
  },
  {
    id: "serif",
    label: "Editorial Serif",
    stack: '"Playfair Display", Georgia, serif',
    weight: 600,
    letterSpacing: 0,
  },
  {
    id: "stamp",
    label: "Bold Stamp",
    stack: '"Archivo Black", Impact, sans-serif',
    weight: 400,
    letterSpacing: 0.04,
  },
];

export function getFont(id: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0]!;
}

export const COLOR_PRESETS = [
  { label: "Crisp White", hex: "#FFFFFF" },
  { label: "Film Amber", hex: "#FFB020" },
  { label: "Matte Black", hex: "#141414" },
  { label: "Accent", hex: "#3DDC97" },
];

export const CORNERS: { id: StampCorner; label: string }[] = [
  { id: "top-left", label: "Top left" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-right", label: "Bottom right" },
];

export interface FormatOption {
  id: string;
  label: string;
  /** Builds the date portion; the time portion is appended separately. */
  date: (d: Date) => string;
  withTime: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "ymd-hm",
    label: "2024/03/18 14:05",
    date: (d) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`,
    withTime: true,
  },
  {
    id: "mdy-hm",
    label: "03.18.2024 02:05 PM",
    date: (d) => `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${d.getFullYear()}`,
    withTime: true,
  },
  {
    id: "dmy-hm",
    label: "18-03-2024 14:05",
    date: (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`,
    withTime: true,
  },
  {
    id: "dmmmy",
    label: "18 Mar 2024",
    date: (d) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    withTime: false,
  },
  {
    id: "mmmdy",
    label: "Mar 18, 2024",
    date: (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    withTime: false,
  },
  {
    id: "ymd",
    label: "2024/03/18",
    date: (d) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`,
    withTime: false,
  },
];

export function getFormat(id: string): FormatOption {
  return FORMAT_OPTIONS.find((f) => f.id === id) ?? FORMAT_OPTIONS[0]!;
}

export function formatStampText(iso: string | null, formatId: string, hour24: boolean): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const fmt = getFormat(formatId);
  const datePart = fmt.date(d);
  if (!fmt.withTime) return datePart;
  if (hour24) return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const h = d.getHours() % 12 || 12;
  const suffix = d.getHours() < 12 ? "AM" : "PM";
  return `${datePart} ${pad(h)}:${pad(d.getMinutes())} ${suffix}`;
}
