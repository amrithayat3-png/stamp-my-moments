import { Images, Lock, ShieldCheck, X } from "lucide-react";

interface Props {
  open: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

const points = [
  {
    icon: Images,
    title: "Read your photos",
    body: "PhotoStamp needs gallery access to open the photos you choose and read their capture dates.",
  },
  {
    icon: Lock,
    title: "Stays on your device",
    body: "Nothing is uploaded. No account, no cloud, no tracking — every photo is processed locally.",
  },
  {
    icon: ShieldCheck,
    title: "Only what you pick",
    body: "You select the photos yourself. PhotoStamp never browses your gallery in the background.",
  },
];

export function PermissionRationale({ open, onAllow, onDismiss }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 animate-in fade-in sm:items-center">
      <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Gallery access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's exactly what the next permission prompt is for.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        <ul className="space-y-4">
          {points.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onAllow}
          className="mt-6 w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full rounded-2xl px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
