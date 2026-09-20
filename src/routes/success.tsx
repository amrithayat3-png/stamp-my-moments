import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/photostamp/app-shell";
import { useBatch } from "@/lib/photostamp/batch-store";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "All done — PhotoStamp" },
      {
        name: "description",
        content: "Your stamped photos are saved to your gallery, ready to share.",
      },
      { property: "og:title", content: "All done — PhotoStamp" },
      {
        property: "og:description",
        content: "Stamped copies saved locally to your device gallery.",
      },
    ],
  }),
  component: SuccessScreen,
});

function SuccessScreen() {
  const navigate = useNavigate();
  const { photos, clearAll } = useBatch();

  return (
    <AppShell title="Finished" backTo="/customize">
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 -z-10 rounded-full bg-success/25 blur-3xl" />
          <div className="glass flex size-24 items-center justify-center rounded-[1.75rem]">
            <CheckCircle2 className="size-11 text-success" strokeWidth={1.5} />
          </div>
        </div>
        <p className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Coming in phase 3
        </p>
        <h1 className="mt-5 text-2xl font-semibold">Saving to your gallery</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Writing stamped copies into a PhotoStamp album comes next. For now this confirms the flow
          for your {photos.length} selected photo{photos.length === 1 ? "" : "s"}.
        </p>
        <button
          type="button"
          onClick={() => {
            clearAll();
            navigate({ to: "/" });
          }}
          className="mt-9 w-full max-w-xs rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Start a new batch
        </button>
      </div>
    </AppShell>
  );
}
