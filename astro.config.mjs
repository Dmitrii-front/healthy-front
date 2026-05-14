// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prefetchList from "./web/integrations/prefetch-list.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: "https://sdoctorom.health",
  srcDir: "./web",
  output: "static",
  adapter: cloudflare({ imageService: "compile" }),
  integrations: [
    react({
      babel: { plugins: [["babel-plugin-react-compiler", {}]] },
    }),
    sitemap({ filter: (page) => !page.includes("/app/") }),
    prefetchList(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      TanStackRouterVite({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: path.resolve(__dirname, "src/app/routes"),
        generatedRouteTree: path.resolve(__dirname, "src/app/routeTree.gen.ts"),
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
  },
  prefetch: { defaultStrategy: "viewport" },
  // Auth (sign-in, sign-up, forgot-password, verify-email, reset-password)
  // is served by Astro pages in the SEO zone — no redirects into the SPA.
});
