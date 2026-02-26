import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logging.middleware";
import { globalLimiter } from "./middleware/rateLimit.middleware";
import { sanitize } from "./middleware/sanitize.middleware";
import { csrfProtection } from "./middleware/csrf.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import apiRouter from "./routes/index";

const app = express();

// 1. Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// 2. CORS
app.use(
  cors({
    origin: env.NODE_ENV === "production" ? env.CLIENT_URL : true,
    credentials: true,
  }),
);

// 3. Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Request logging
app.use(requestLogger);

// 5. Rate limiting
app.use(globalLimiter);

// 6. Input sanitization (XSS prevention)
app.use(sanitize);

// 7. CSRF protection
if (env.NODE_ENV === "production") {
  app.use(csrfProtection(env.CLIENT_URL));
}

// 8. API routes
app.use("/api", apiRouter);

// Legacy health endpoint (kept for backward compatibility)
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: env.COMMIT_SHA,
    environment: env.NODE_ENV,
  });
});

// 9. Static frontend serving in production
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

// 10. Not found handler
app.use(notFoundHandler);

// 11. Global error handler (must be last)
app.use(errorHandler);

export { app };
