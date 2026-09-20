import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, ImagePlus, Layers, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/photostamp/app-shell";
import { PermissionRationale } from "@/components/photostamp/permission-rationale";
import { useBatch } from "@/lib/photostamp/batch-store";
import { pickPhotos } from "@/lib/photostamp/pick-photos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhotoStamp — Batch date stamps for your photos" },
      {
        name: "description",
        content:
          "Add clean, customizable date and time stamps to photos in batches. Private by design — everything stays on your device.",
      },
      { property: "og:title", content: "PhotoStamp — Batch date stamps for your photos" },
      {
        property: "og:description",
        content:
          "Pick photos, read their capture dates, and burn in a stamp you control. No accounts, no cloud, no ads.",
      },
    ],
  }),
  component: Home,
});

const highlights = [
  { icon: CalendarClock, label: "Reads capture dates from each photo" },
  { icon: Layers, label: "Stamp dozens of photos in one pass" },
  { icon: ShieldCheck, label: "Fully offline — nothing leaves your phone" },
];

function Home() {
  const navigate = useNavigate();
  const { addPhotos } = useBatch();
  const [showRationale, setShowRationale] = useState(false);
  const [busy, setBusy] = useState(false);

  async function runPicker() {
    setShowRationale(false);
    setBusy(true);
    try {
      const picked = await pickPhotos();
      if (picked.length > 0) {
        addPhotos(picked);
        navigate({ to: "/batch" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell subtitle="Date stamps, done in batches">
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="relative mb-10">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/25 blur-3xl" />
          <div className="glass flex size-28 items-center justify-center rounded-[2rem]">
            <ImagePlus className="size-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="max-w-md text-balance text-3xl font-semibold sm:text-4xl">
          Stamp your memories with the day they happened
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          Choose a few photos to begin. PhotoStamp keeps everything on your device — no account, no
          uploads.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => setShowRationale(true)}
          className="mt-9 w-full max-w-xs rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Opening gallery…" : "Select photos"}
        </button>

        <ul className="mt-12 grid w-full max-w-md gap-3 text-left">
          {highlights.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-muted-foreground"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <PermissionRationale
        open={showRationale}
        onAllow={runPicker}
        onDismiss={() => setShowRationale(false)}
      />
    </AppShell>
  );
}
