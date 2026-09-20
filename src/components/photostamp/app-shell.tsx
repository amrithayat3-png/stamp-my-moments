import { Link } from "@tanstack/react-router";
import { ArrowLeft, Moon, Stamp, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/lib/photostamp/theme";

interface AppShellProps {
  title?: string;
  subtitle?: string;
  backTo?: "/" | "/batch" | "/customize";
  children: ReactNode;
  footer?: ReactNode;
}

export function AppShell({ title, subtitle, backTo, children, footer }: AppShellProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-4">
          {backTo ? (
            <Link
              to={backTo}
              aria-label="Go back"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
            >
              <ArrowLeft className="size-4" />
            </Link>
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Stamp className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold">
              {title ?? "PhotoStamp"}
            </p>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-8 pt-6">{children}</main>

      {footer ? (
        <div className="glass sticky bottom-0 z-20 border-x-0 border-b-0">
          <div className="mx-auto w-full max-w-3xl px-5 py-4">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}
