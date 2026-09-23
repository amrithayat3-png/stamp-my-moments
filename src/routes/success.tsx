import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FolderOpen,
  ImagePlus,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/photostamp/app-shell";
import { ProcessingOverlay } from "@/components/photostamp/processing-overlay";
import { useBatch } from "@/lib/photostamp/batch-store";
import { useBatchProcessor } from "@/lib/photostamp/use-batch-processor";
import { ALBUM_PATH, downloadFile, downloadZip, isNativeSave, shareStamped } from "@/lib/photostamp/save";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "All done — PhotoStamp" },
      {
        name: "description",
        content: "Your stamped photos are saved as new files in the PhotoStamp album, ready to share.",
      },
      { property: "og:title", content: "All done — PhotoStamp" },
      {
        property: "og:description",
        content: "Stamped copies saved locally to Pictures/PhotoStamp — originals untouched.",
      },
    ],
  }),
  component: SuccessScreen,
});

function SuccessScreen() {
  const navigate = useNavigate();
  const { photos, settingsFor, clearAll } = useBatch();
  const { status, progress, saved, skipped, run } = useBatchProcessor();
  const [sharing, setSharing] = useState(false);

  const ready = photos.filter((p) => p.captureDate);

  useEffect(() => {
    if (status === "idle" && ready.length > 0) {
      void run(ready, settingsFor);
    }
  }, [status, ready, run, settingsFor]);

  if (photos.length === 0) {
    return (
      <AppShell title="Finished" backTo="/">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="glass mb-6 flex size-20 items-center justify-center rounded-3xl">
            <ImagePlus className="size-9 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold">Nothing to save</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Start a batch by picking some photos.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-7 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Select photos
          </button>
        </div>
      </AppShell>
    );
  }

  async function share() {
    setSharing(true);
    try {
      const result = await shareStamped(saved);
      if (result === "unsupported") {
        toast("Sharing isn't available here", {
          description: "Use Download instead — sharing works on your phone.",
        });
      }
    } catch {
      toast("Sharing was cancelled");
    } finally {
      setSharing(false);
    }
  }

  const failedCount = skipped.length;

  return (
    <AppShell title="Finished" subtitle={status === "done" ? "Batch complete" : "Working…"}>
      <ProcessingOverlay
        open={status !== "done"}
        current={progress.current}
        total={progress.total || ready.length}
        name={progress.name}
        url={progress.url}
        stage={progress.stage}
      />

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-7 mt-4">
          <div className="absolute inset-0 -z-10 rounded-full bg-success/25 blur-3xl" />
          <div className="glass flex size-24 items-center justify-center rounded-[1.75rem]">
            <CheckCircle2 className="size-11 text-success" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">
          {saved.length} photo{saved.length === 1 ? "" : "s"} stamped
        </h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="size-4 text-primary" />
          {isNativeSave() ? `Saved to ${ALBUM_PATH}` : "Downloaded to your device"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Originals were left exactly as they were.
        </p>
      </div>

      {failedCount > 0 ? (
        <div className="mt-7 rounded-3xl border border-warning/50 bg-warning/10 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="size-4" />
            {failedCount} photo{failedCount === 1 ? "" : "s"} skipped
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {skipped.map((item) => (
              <li key={item.name} className="truncate">
                <span className="font-medium text-foreground">{item.name}</span> — {item.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {saved.length > 0 ? (
        <>
          <div className="mt-7 grid grid-cols-3 gap-2">
            {saved.slice(0, 9).map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => downloadFile(file)}
                title={`Download ${file.name}`}
                className="overflow-hidden rounded-2xl border border-border transition-transform active:scale-[0.98]"
              >
                <img
                  src={URL.createObjectURL(file.blob)}
                  alt={file.name}
                  className="aspect-square w-full object-cover"
                />
              </button>
            ))}
          </div>
          {saved.length > 9 ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              +{saved.length - 9} more saved
            </p>
          ) : null}

          <div className="mt-7 space-y-2">
            <button
              type="button"
              onClick={share}
              disabled={sharing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <Share2 className="size-4" />
              {sharing ? "Opening share sheet…" : "Share stamped photos"}
            </button>
            {!isNativeSave() ? (
              <button
                type="button"
                onClick={() =>
                  void downloadZip(saved).catch(() => toast("Could not build the zip file"))
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <Download className="size-4" />
                Download all as zip
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                clearAll();
                navigate({ to: "/" });
              }}
              className="w-full rounded-2xl px-5 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Start a new batch
            </button>
          </div>
        </>
      ) : (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate({ to: "/customize" })}
            className="rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Back to customize
          </button>
        </div>
      )}
    </AppShell>
  );
}
