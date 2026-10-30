import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build`        -> dist/ with separate files (relative paths, works on GitHub Pages)
// `npm run build:single` -> dist/index.html with everything inlined, paintings included
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "single" ? [react(), viteSingleFile()] : [react()],
  build: mode === "single" ? { assetsInlineLimit: 100_000_000 } : {},
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}));
