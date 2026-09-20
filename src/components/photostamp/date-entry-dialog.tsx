import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { toLocalInputValue } from "@/lib/photostamp/exif";

interface Props {
  open: boolean;
  photoName: string;
  initialValue: string | null;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function DateEntryDialog({ open, photoName, initialValue, onSave, onClose }: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue ?? "");
      setError(null);
    }
  }, [open, initialValue]);

  if (!open) return null;

  function save() {
    if (!value) {
      setError("Pick a date and time to continue.");
      return;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      setError("That date doesn't look right.");
      return;
    }
    if (parsed.getFullYear() < 1900) {
      setError("Choose a year after 1900.");
      return;
    }
    if (parsed.getTime() > Date.now() + 60_000) {
      setError("Capture dates can't be in the future.");
      return;
    }
    onSave(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 animate-in fade-in sm:items-center">
      <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Set capture date</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">{photoName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          This photo has no capture date stored in it, so nothing was guessed for you. Enter the date
          and time it was taken.
        </p>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <CalendarClock className="size-4 shrink-0 text-primary" />
          <input
            type="datetime-local"
            value={value}
            max={toLocalInputValue(new Date())}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        {error ? <p className="mt-2 text-xs font-medium text-destructive">{error}</p> : null}

        <button
          type="button"
          onClick={save}
          className="mt-6 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Save date
        </button>
      </div>
    </div>
  );
}
