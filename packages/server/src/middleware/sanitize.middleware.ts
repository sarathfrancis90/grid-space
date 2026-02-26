import type { Request, Response, NextFunction } from "express";

/** Strip HTML tags from a string to prevent XSS */
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Recursively sanitize all string values in an object */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return stripHtml(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeValue(val);
    }
    return result;
  }
  return value;
}

/** Middleware that sanitizes request body, query, and params strings */
export function sanitize(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    const sanitized = sanitizeValue(req.query) as Record<string, unknown>;
    for (const [key, val] of Object.entries(sanitized)) {
      (req.query as Record<string, unknown>)[key] = val;
    }
  }
  next();
}
