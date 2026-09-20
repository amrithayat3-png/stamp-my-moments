import { Wand2 } from "lucide-react";
import {
  COLOR_PRESETS,
  CORNERS,
  FONT_OPTIONS,
  FORMAT_OPTIONS,
  getFont,
} from "@/lib/photostamp/stamp-options";
import type { StampSettings } from "@/lib/photostamp/types";

interface Props {
  settings: StampSettings;
  onChange: (patch: Partial<StampSettings>) => void;
  suggestedColor: string | null;
  scope: "batch" | "photo";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;

export function StampPanel({ settings, onChange, suggestedColor, scope }: Props) {
  return (
    <div className="space-y-3">
      <Section title={`Font · ${scope === "batch" ? "whole batch" : "this photo"}`}>
        <div className="grid gap-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => onChange({ fontId: font.id })}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                settings.fontId === font.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <span className="text-sm">{font.label}</span>
              <span
                className="text-sm"
                style={{ fontFamily: font.stack, fontWeight: font.weight }}
              >
                2024/03/18
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Colour">
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange({ colorHex: preset.hex })}
              aria-label={preset.label}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                settings.colorHex.toUpperCase() === preset.hex
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <span
                className="size-4 rounded-full border border-border"
                style={{ backgroundColor: preset.hex }}
              />
              {preset.label}
            </button>
          ))}
          <label className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium">
            <input
              type="color"
              value={settings.colorHex}
              onChange={(e) => onChange({ colorHex: e.target.value.toUpperCase() })}
              className="size-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
              aria-label="Custom colour"
            />
            Custom
          </label>
        </div>
        {suggestedColor && suggestedColor.toUpperCase() !== settings.colorHex.toUpperCase() ? (
          <button
            type="button"
            onClick={() => onChange({ colorHex: suggestedColor })}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-primary/60 px-3 py-2 text-xs font-medium text-primary"
          >
            <Wand2 className="size-3.5" />
            Best contrast here: {suggestedColor === "#FFFFFF" ? "white" : "near-black"} — apply
          </button>
        ) : null}
        <label className="mt-3 flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
          Soft drop shadow
          <input
            type="checkbox"
            checked={settings.shadow}
            onChange={(e) => onChange({ shadow: e.target.checked })}
            className="size-4 accent-[var(--color-primary)]"
          />
        </label>
      </Section>

      <Section title="Size & inset">
        <label className="flex items-center justify-between text-sm">
          Stamp size
          <span className="text-xs text-muted-foreground">{settings.sizePct.toFixed(1)}%</span>
        </label>
        <input
          type="range"
          min={1.5}
          max={12}
          step={0.1}
          value={settings.sizePct}
          onChange={(e) => onChange({ sizePct: Number(e.target.value) })}
          className="mt-2 w-full accent-[var(--color-primary)]"
          aria-label="Stamp size"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Scaled to each photo's resolution, so it looks the same on every image.
        </p>
        <label className="mt-4 flex items-center justify-between text-sm">
          Edge padding
          <span className="text-xs text-muted-foreground">{settings.insetPct.toFixed(1)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={15}
          step={0.5}
          value={settings.insetPct}
          onChange={(e) => onChange({ insetPct: Number(e.target.value) })}
          className="mt-2 w-full accent-[var(--color-primary)]"
          aria-label="Edge padding"
        />
      </Section>

      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          {CORNERS.map((corner) => (
            <button
              key={corner.id}
              type="button"
              onClick={() => onChange({ corner: corner.id })}
              className={chip(settings.corner === corner.id)}
            >
              {corner.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Date format">
        <div className="grid gap-2">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => onChange({ formatId: fmt.id })}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                settings.formatId === fmt.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-secondary"
              }`}
              style={{ fontFamily: getFont(settings.fontId).stack }}
            >
              {fmt.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => onChange({ hour24: true })} className={chip(settings.hour24)}>
            24-hour
          </button>
          <button
            type="button"
            onClick={() => onChange({ hour24: false })}
            className={chip(!settings.hour24)}
          >
            12-hour
          </button>
        </div>
      </Section>
    </div>
  );
}
