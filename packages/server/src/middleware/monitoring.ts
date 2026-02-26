import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { AppError } from "../utils/AppError";

interface ErrorContext {
  method: string;
  url: string;
  statusCode: number;
  userId?: string;
  errorName: string;
  message: string;
  stack?: string;
  isOperational: boolean;
}

/**
 * Monitoring middleware that captures errors with rich context.
 * In production, this could forward to Sentry or another service.
 * Must be registered BEFORE the errorHandler middleware.
 */
export function monitoringMiddleware(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const context: ErrorContext = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    errorName: err.name,
    message: err.message,
    isOperational,
  };

  // Attach userId if available (set by auth middleware)
  const user = (req as unknown as Record<string, unknown>).user;
  if (user && typeof user === "object" && "id" in user) {
    context.userId = String((user as { id: unknown }).id);
  }

  // Only include stack for unexpected (non-operational) errors
  if (!isOperational) {
    context.stack = err.stack;
  }

  // Log based on severity
  if (!isOperational) {
    logger.error({ err, context }, "Unhandled server error");
  } else if (statusCode >= 500) {
    logger.error({ context }, "Server error");
  } else if (statusCode >= 400) {
    logger.warn({ context }, "Client error");
  }

  // Forward Sentry DSN integration
  if (process.env.SENTRY_DSN && !isOperational) {
    // Sentry.captureException(err, { extra: context });
    // Placeholder — add @sentry/node when ready
    logger.info("Error would be reported to Sentry");
  }

  next(err);
}

/**
 * Track request metrics: duration, status code, path.
 * Registered early in the middleware chain.
 */
export function requestMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    };

    if (duration > 5000) {
      logger.warn(meta, "Slow request detected");
    }
  });

  next();
}
