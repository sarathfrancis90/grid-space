// ============================================
// GridSpace — Static File Serving for Production
// ============================================
// Add this to packages/server/src/app.ts AFTER all API routes
// but BEFORE the error handler middleware.
//
// In production, Express serves the built Vite frontend.
// In development, Vite dev server runs separately.
// ============================================

import path from "path";
import express from "express";

// --- Add this block to app.ts after all /api and /auth routes ---

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "public");

  // Serve static assets with cache headers
  app.use(
    express.static(clientDistPath, {
      maxAge: "1y", // Cache static assets aggressively
      etag: true,
      index: false, // Don't auto-serve index.html for /
    }),
  );

  // SPA fallback: all non-API routes serve index.html
  // This lets React Router handle client-side routing
  app.get("*", (req, res, next) => {
    // Don't intercept API routes, WebSocket, or health check
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/auth") ||
      req.path.startsWith("/socket.io") ||
      req.path === "/health"
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// --- End of static serving block ---

// ============================================
// Full app.ts example showing where this fits:
// ============================================
/*
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';

const app = express();

// 1. Security headers
app.use(helmet({
  contentSecurityPolicy: false,  // Allow inline scripts from Vite
}));

// 2. CORS
app.use(cors({
  origin: env.CLIENT_URL || true,  // In production, same origin
  credentials: true,
}));

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));

// 4. Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.COMMIT_SHA || 'dev',
  });
});

// 5. API routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// 6. Static frontend (PRODUCTION ONLY)
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, 'public');
  
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    etag: true,
    index: false,
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/auth') || 
        req.path.startsWith('/socket.io') ||
        req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 7. Error handler (must be last)
app.use(errorHandler);

export { app };
*/
