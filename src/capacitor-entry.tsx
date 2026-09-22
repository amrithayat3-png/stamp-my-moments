/**
 * Capacitor (Android WebView) entry point.
 *
 * The normal Lovable/web build is a TanStack Start SSR build: it produces a
 * server bundle and has no self-contained index.html, so a packaged APK has
 * nothing to render and shows a white screen. This entry renders exactly the
 * same routes and UI as a plain client-side SPA — no SSR, no server functions,
 * no Node runtime — which is what Capacitor can load from webDir.
 *
 * Memory history is used on purpose: the WebView's local origin has no server
 * to fall back to index.html for deep paths, and the app always starts at "/".
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createRouter, createMemoryHistory } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import "./styles.css";

function showStartupError(error: unknown) {
  const message =
    error instanceof Error ? `${error.message}\n\n${error.stack ?? ""}` : String(error);
  const host = document.getElementById("root");
  if (!host) return;
  host.innerHTML = "";
  const box = document.createElement("div");
  box.setAttribute(
    "style",
    "font:14px/1.5 system-ui,sans-serif;padding:24px;color:#111;background:#fff;min-height:100vh",
  );
  const title = document.createElement("h1");
  title.textContent = "PhotoStamp couldn't start";
  title.setAttribute("style", "font-size:17px;margin:0 0 8px");
  const hint = document.createElement("p");
  hint.textContent = "The details below help identify what went wrong.";
  hint.setAttribute("style", "color:#555;margin:0 0 12px");
  const pre = document.createElement("pre");
  pre.textContent = message;
  pre.setAttribute(
    "style",
    "white-space:pre-wrap;word-break:break-word;background:#f3f4f6;padding:12px;border-radius:8px;font-size:12px",
  );
  box.append(title, hint, pre);
  host.appendChild(box);
}

function start() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element #root is missing from index.html");

  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/"] }),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

// White screens are almost always a throw during startup; surface it instead.
try {
  start();
} catch (error) {
  console.error(error);
  showStartupError(error);
}

window.addEventListener("error", (event) => {
  if (document.getElementById("root")?.childElementCount === 0) {
    showStartupError(event.error ?? event.message);
  }
});
window.addEventListener("unhandledrejection", (event) => {
  if (document.getElementById("root")?.childElementCount === 0) {
    showStartupError(event.reason);
  }
});
