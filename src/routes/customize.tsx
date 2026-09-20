import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Type, Palette, MapPin } from "lucide-react";
import { AppShell } from "@/components/photostamp/app-shell";
import { useBatch } from "@/lib/photostamp/batch-store";

export const Route = createFileRoute("/customize")({
  head: () => ({
    meta: [
      { title: "Customize stamp — PhotoStamp" },
      {
        name: "description",
        content: "Choose the date format, position, colour, and size of the stamp burned onto your photos.",
      },
      { property: "og:title", content: "Customize stamp — PhotoStamp" },
      {
        property: "og:description",
        content: "Set the look of your date stamp and preview it before it's applied.",
      },
    ],
  }),
  component: CustomizeScreen,
});

const upcoming = [
  { icon: Type, label: "Date & time formats" },
  { icon: MapPin, label: "Stamp position" },
  { icon: Palette, label: "Colour, size & opacity" },
];

function CustomizeScreen() {
  const navigate = useNavigate();
  const { photos } = useBatch();

  return (
    <AppShell
      title="Customize stamp"
      subtitle={`${photos.length} photo${photos.length === 1 ? "" : "s"} in batch`}
      backTo="/batch"
      footer={
        <button
          type="button"
          onClick={() => navigate({ to: "/success" })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Continue
          <ArrowRight className="size-4" />
        </button>
      }
    >
      <div className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center">
        <p className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Coming in phase 2
        </p>
        <h1 className="mt-5 text-2xl font-semibold">Stamp preview & controls</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Capture-date reading and the stamp editor land here next. Your batch is already wired
          through, so nothing is lost.
        </p>
        <ul className="mt-8 grid w-full max-w-sm gap-2 text-left">
          {upcoming.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground"
            >
              <Icon className="size-4 text-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
