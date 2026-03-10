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

  // Detect Prisma errors for better diagnostics
  const prismaCode = (err as { code?: string }).code;
  if (
    prismaCode === "P2021" ||
    prismaCode === "P2010" ||
    prismaCode === "P2022"
  ) {
    // P2021: table does not exist
    // P2022: column does not exist
    // P2010: raw query failed
    logger.error(
      { err, prismaCode },
      "Database schema error — run: npx prisma migrate deploy",
    );
    res
      .status(503)
      .json(
        apiError(503, "Database is not ready. Please try again in a moment."),
      );
    return;
  }

  if (prismaCode === "P2025") {
    // P2025: record not found (required relation or missing record)
    res.status(404).json(apiError(404, "The requested record was not found"));
    return;
  }

  if (prismaCode === "P2002") {
    // Unique constraint violation
    res
      .status(409)
      .json(apiError(409, "A record with that value already exists"));
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
