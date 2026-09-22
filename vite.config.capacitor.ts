/**
 * Static SPA build used ONLY for the Capacitor Android app.
 *
 * It deliberately does NOT use the TanStack Start plugin: Start builds an SSR
 * server bundle (nitro / Cloudflare worker) which a packaged APK cannot run.
 * This config emits a plain, self-contained client bundle into `dist/`
 * (capacitor.config.ts webDir) with relative asset paths so everything resolves
 * from the WebView's local origin.
 *
 * Build with: bun run build:capacitor   (or npm run build:capacitor)
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import { rename, rm } from "node:fs/promises";
import { resolve } from "node:path";

/** Emits dist/index.html (Vite names the output after the html input file). */
function emitIndexHtml() {
  return {
    name: "photostamp-capacitor-index-html",
    async closeBundle() {
      const dir = resolve(process.cwd(), "dist");
      const from = resolve(dir, "index.capacitor.html");
      const to = resolve(dir, "index.html");
      await rm(to, { force: true });
      await rename(from, to);
    },
  };
}

export default defineConfig({
  // Relative base so index.html references ./assets/* and works from file:// or
  // Capacitor's http://localhost origin.
  base: "./",
  plugins: [react(), tailwindcss(), tsconfigPaths({ projects: ["./tsconfig.json"] }), emitIndexHtml()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      input: fileURLToPath(new URL("./index.capacitor.html", import.meta.url)),
    },
  },
});
