// ============================================
// GridSpace — Vite Configuration
// packages/client/vite.config.ts
// ============================================
// In development: proxies /api and /auth to Express on port 3001
// In production: same origin (Express serves everything)
// ============================================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Use relative base so assets work on any domain/path
  base: "/",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode === "development",
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-yjs": ["yjs", "y-websocket"],
          "vendor-charts": ["chart.js"],
          "vendor-sheetjs": ["xlsx"],
        },
      },
    },
  },

  // Development: proxy API requests to Express backend
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true, // WebSocket proxy
      },
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
}));
