import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// CORS
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? true : env.CLIENT_URL,
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: env.COMMIT_SHA,
    environment: env.NODE_ENV,
  });
});

// Status endpoint — feature progress
app.get("/api/status", (_req, res) => {
  res.json({
    app: "GridSpace",
    version: "0.1.0",
    features: {
      total: 427,
      completed: 0,
      remaining: 427,
      sprints: 16,
    },
  });
});

// Static frontend serving in production
if (env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "public");

  app.use(
    express.static(clientDistPath, {
      maxAge: "1y",
      etag: true,
      index: false,
    }),
  );

  app.get("*", (req, res, next) => {
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

export { app };
