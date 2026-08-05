import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
//
// ── Route Tree Auto-generation ──────────────────────────────────────────────
// TanStackRouterVite watches src/routes/** and auto-regenerates
// src/routeTree.gen.ts on every file save during `pnpm dev`.
// It also regenerates at the start of `pnpm build`.
//
// If routeTree.gen.ts ever gets stale (e.g. after a git pull that adds new
// route files), simply run `pnpm dev` once — the plugin will regenerate it
// within seconds. Never edit routeTree.gen.ts manually.
//
// Confirmed settings:
//   routesDirectory  → ./src/routes        (all route files live here)
//   generatedRouteTree → ./src/routeTree.gen.ts  (auto-generated, commit this)
// ────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      // Ensures the route tree is also generated when vite starts in build mode
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
