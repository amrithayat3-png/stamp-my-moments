import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  current: number;
  total: number;
  name: string;
  url: string;
}

export function ProcessingOverlay({ open, current, total, name, url }: Props) {
  if (!open) return null;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm animate-in fade-in">
      <div className="glass w-full max-w-sm rounded-3xl p-6 text-center">
        <div className="mx-auto mb-5 size-24 overflow-hidden rounded-2xl border border-border bg-secondary">
          {url ? <img src={url} alt="" className="size-full object-cover" /> : null}
        </div>
        <p className="flex items-center justify-center gap-2 text-sm font-semibold">
          <Loader2 className="size-4 animate-spin text-primary" />
          Stamping {Math.min(current, total)} of {total}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{name || "Preparing…"}</p>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-muted-foreground">{pct}%</p>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Your originals stay untouched — stamped copies are saved as new files.
        </p>
      </div>
    </div>
  );
}
