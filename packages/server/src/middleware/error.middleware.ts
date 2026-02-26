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
  const errName = (err as { code?: string }).code;
  if (errName === "P2021" || errName === "P2010") {
    // P2021: table does not exist, P2010: raw query failed
    logger.error(
      { err, prismaCode: errName },
      "Database schema error — tables may not exist. Run: npx prisma migrate deploy",
    );
    res
      .status(503)
      .json(
        apiError(503, "Database is not ready. Please try again in a moment."),
      );
    return;
  }

  if (errName === "P2002") {
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
