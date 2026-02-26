import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { apiError } from "../utils/apiResponse";
import logger from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(apiError(err.statusCode, err.message));
    return;
  }

  // Log unexpected errors with stack trace
  logger.error({ err }, "Unhandled error");

  res.status(500).json(apiError(500, "Internal server error"));
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res
    .status(404)
    .json(apiError(404, `Route not found: ${req.method} ${req.path}`));
}
