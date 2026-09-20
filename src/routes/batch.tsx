import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, ImagePlus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/photostamp/app-shell";
import { DateEntryDialog } from "@/components/photostamp/date-entry-dialog";
import { useBatch } from "@/lib/photostamp/batch-store";
import { pickPhotos } from "@/lib/photostamp/pick-photos";

export const Route = createFileRoute("/batch")({
  head: () => ({
    meta: [
      { title: "Your batch — PhotoStamp" },
      {
        name: "description",
        content:
          "Review the photos in your batch, fill in any missing capture dates, and add more before stamping.",
      },
      { property: "og:title", content: "Your batch — PhotoStamp" },
      {
        property: "og:description",
        content: "Review, trim, and extend the set of photos you're about to date stamp.",
      },
    ],
  }),
  component: BatchScreen,
});

function BatchScreen() {
  const navigate = useNavigate();
  const { photos, addPhotos, removePhoto, clearAll, setCaptureDate, missingDateCount } = useBatch();
  const [busy, setBusy] = useState(false);
  const [dateDialogFor, setDateDialogFor] = useState<string | null>(null);

  async function addMore() {
    setBusy(true);
    try {
      addPhotos(await pickPhotos());
    } finally {
      setBusy(false);
    }
  }

  if (photos.length === 0) {
    return (
      <AppShell title="Your batch" backTo="/">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="glass mb-6 flex size-20 items-center justify-center rounded-3xl">
            <ImagePlus className="size-9 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold">No photos in this batch</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Pick some photos and they'll show up here, ready to stamp.
          </p>
          <button
            type="button"
            onClick={addMore}
            disabled={busy}
            className="mt-7 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            Add photos
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Your batch"
      subtitle={`${photos.length} photo${photos.length === 1 ? "" : "s"} selected`}
      backTo="/"
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {photos.length} photo{photos.length === 1 ? "" : "s"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {missingDateCount > 0
                ? `${missingDateCount} still need${missingDateCount === 1 ? "s" : ""} a date`
                : "All dates found"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/customize" })}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Continue to Customize
            <ArrowRight className="size-4" />
          </button>
        </div>
      }
    >
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={addMore}
          disabled={busy}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-60"
        >
          <ImagePlus className="size-3.5" />
          Add more
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => {
          const ready = Boolean(photo.captureDate);
          return (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Remove ${photo.name}`}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-destructive"
              >
                <X className="size-4" />
              </button>
              <div className="absolute inset-x-2 bottom-2">
                {ready ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-medium text-success backdrop-blur">
                    <CheckCircle2 className="size-3" />
                    Ready
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDateDialogFor(photo.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-warning px-2.5 py-1 text-[11px] font-semibold text-warning-foreground"
                  >
                    <CalendarClock className="size-3" />
                    Needs date
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DateEntryDialog
        open={dateDialogFor !== null}
        photoName={photos.find((p) => p.id === dateDialogFor)?.name ?? ""}
        initialValue={photos.find((p) => p.id === dateDialogFor)?.captureDate ?? null}
        onClose={() => setDateDialogFor(null)}
        onSave={(value) => {
          if (dateDialogFor) setCaptureDate(dateDialogFor, value);
          setDateDialogFor(null);
        }}
      />
    </AppShell>
  );
}
