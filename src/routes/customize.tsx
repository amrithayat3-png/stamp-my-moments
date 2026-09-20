import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/photostamp/app-shell";
import { DateEntryDialog } from "@/components/photostamp/date-entry-dialog";
import { StampPanel } from "@/components/photostamp/stamp-panel";
import { StampPreview } from "@/components/photostamp/stamp-preview";
import { useBatch } from "@/lib/photostamp/batch-store";
import { suggestContrastColor } from "@/lib/photostamp/render-stamp";

export const Route = createFileRoute("/customize")({
  head: () => ({
    meta: [
      { title: "Customize stamp — PhotoStamp" },
      {
        name: "description",
        content:
          "Choose the date format, font, colour, size, and corner of the stamp burned onto your photos, with a live preview.",
      },
      { property: "og:title", content: "Customize stamp — PhotoStamp" },
      {
        property: "og:description",
        content: "Set the look of your date stamp and preview it on every photo in the batch.",
      },
    ],
  }),
  component: CustomizeScreen,
});

function CustomizeScreen() {
  const navigate = useNavigate();
  const { photos, settings, settingsFor, updateSettings, setOverride, setCaptureDate, missingDateCount } =
    useBatch();

  const [index, setIndex] = useState(0);
  const [scope, setScope] = useState<"batch" | "photo">("batch");
  const [dateDialogFor, setDateDialogFor] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);

  const safeIndex = photos.length === 0 ? 0 : Math.min(index, photos.length - 1);
  const photo = photos[safeIndex];
  const effective = useMemo(
    () => (photo ? settingsFor(photo) : settings),
    [photo, settingsFor, settings],
  );

  useEffect(() => {
    setSuggested(null);
  }, [safeIndex, effective.corner]);

  const onCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      setSuggested(suggestContrastColor(canvas, effective));
    },
    [effective],
  );

  if (!photo) {
    return (
      <AppShell title="Customize stamp" backTo="/batch">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-xl font-semibold">Nothing to customize yet</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Pick some photos first and they'll show up here with a live stamp preview.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-7 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Select photos
          </button>
        </div>
      </AppShell>
    );
  }

  const blocked = missingDateCount > 0;
  const firstMissing = photos.find((p) => !p.captureDate);

  function applyChange(patch: Parameters<typeof updateSettings>[0]) {
    if (scope === "batch") updateSettings(patch);
    else setOverride(photo!.id, patch);
  }

  return (
    <AppShell
      title="Customize stamp"
      subtitle={`Photo ${safeIndex + 1} of ${photos.length}`}
      backTo="/batch"
      footer={
        <div className="space-y-2">
          {blocked ? (
            <button
              type="button"
              onClick={() => {
                const target = firstMissing;
                if (!target) return;
                setIndex(photos.findIndex((p) => p.id === target.id));
                setDateDialogFor(target.id);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-warning px-5 py-4 text-sm font-semibold text-warning-foreground transition-transform active:scale-[0.98]"
            >
              <AlertTriangle className="size-4" />
              {missingDateCount} photo{missingDateCount === 1 ? " needs" : "s need"} a date — fix now
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate({ to: "/success" })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      }
    >
      <StampPreview
        url={photo.url}
        captureDate={photo.captureDate}
        settings={effective}
        onCanvasReady={onCanvasReady}
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, (i || safeIndex) - 1))}
          disabled={safeIndex === 0}
          aria-label="Previous photo"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs font-medium">{photo.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {photo.captureDate
              ? photo.dateSource === "exif"
                ? "Date from photo metadata"
                : "Date set by you"
              : "No date yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIndex(Math.min(photos.length - 1, safeIndex + 1))}
          disabled={safeIndex >= photos.length - 1}
          aria-label="Next photo"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Preview ${p.name}`}
            className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
              i === safeIndex ? "border-primary" : "border-transparent opacity-70"
            }`}
          >
            <img src={p.url} alt={p.name} className="size-full object-cover" />
            {!p.captureDate ? (
              <span className="absolute inset-x-0 bottom-0 bg-warning/90 py-0.5 text-[9px] font-semibold text-warning-foreground">
                Needs date
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setDateDialogFor(photo.id)}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
          photo.captureDate
            ? "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            : "border-warning bg-warning/10 text-warning"
        }`}
      >
        <CalendarClock className="size-4" />
        {photo.captureDate ? "Adjust this photo's date" : "Set this photo's date"}
      </button>

      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScope("batch")}
          className={`flex-1 rounded-2xl border px-4 py-3 text-xs font-semibold transition-colors ${
            scope === "batch"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          Apply to all photos
        </button>
        <button
          type="button"
          onClick={() => setScope("photo")}
          className={`flex-1 rounded-2xl border px-4 py-3 text-xs font-semibold transition-colors ${
            scope === "photo"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          Just this photo
        </button>
      </div>

      {photo.override && Object.keys(photo.override).length > 0 ? (
        <button
          type="button"
          onClick={() => setOverride(photo.id, null)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          This photo has custom settings — reset to batch
        </button>
      ) : null}

      <div className="mt-3">
        <StampPanel
          settings={effective}
          onChange={applyChange}
          suggestedColor={suggested}
          scope={scope}
        />
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
