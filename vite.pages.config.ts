// Builds a static copy of the site for GitHub Pages: `vite build -c vite.pages.config.ts`.
// The main app (Lovable / `npm run dev`) keeps using vite.config.ts and is unaffected.
// PAGES_BASE is the address the site lives under, e.g. /pixel-perfect-replay-75334/.
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { publicImages } from "./plugins/public-images";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  root: path.resolve(__dirname, "pages"),
  base: process.env["PAGES_BASE"] ?? "/",
  publicDir: path.resolve(__dirname, "public"),
  envDir: __dirname,
  plugins: [react(), tailwindcss(), publicImages()],
  resolve: {
    alias: [
      // Saving guestbook notes needs a server; the static copy uses a stand-in.
      { find: "@/lib/guestbook.functions", replacement: path.resolve(__dirname, "pages/guestbook-static.ts") },
      { find: "@", replacement: src },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  build: { outDir: path.resolve(__dirname, "dist-pages"), emptyOutDir: true, chunkSizeWarningLimit: 2000 },
});
