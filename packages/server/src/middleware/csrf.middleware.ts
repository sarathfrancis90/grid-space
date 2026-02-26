import type { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiResponse";

/**
 * CSRF protection using SameSite cookie + origin check pattern.
 *
 * For state-changing requests (POST, PUT, PATCH, DELETE):
 * - Checks that the Origin or Referer header matches the expected origin
 * - Skips check for API-key authenticated requests (x-api-key header present)
 * - Skips check for non-browser clients (no Origin/Referer headers)
 */
export function csrfProtection(allowedOrigin: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only check state-changing methods
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
      next();
      return;
    }

    // Skip for API-key authenticated requests
    if (req.headers["x-api-key"]) {
      next();
      return;
    }

    const origin = req.headers["origin"];
    const referer = req.headers["referer"];

    // If neither origin nor referer is set, allow (non-browser client)
    if (!origin && !referer) {
      next();
      return;
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);

    if (requestOrigin && requestOrigin !== allowedOrigin) {
      res.status(403).json(apiError(403, "CSRF validation failed"));
      return;
    }

    next();
  };
}
