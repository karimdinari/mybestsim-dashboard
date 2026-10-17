import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Standard TanStack Start + Vite setup.
// TanStack Start auto-detects src/server.ts (SSR entry) and src/start.ts (middleware).
// Nitro runs at build time only; it auto-detects the deploy preset from the
// environment (e.g. Vercel sets it automatically), with a Node server by default.
export default defineConfig(({ command }) => ({
  server: { port: 8080 },
  resolve: { dedupe: ["react", "react-dom"] },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    ...(command === "build" ? [nitro()] : []),
    viteReact(),
  ],
}));
