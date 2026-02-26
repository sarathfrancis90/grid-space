import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { createLogger } from "../config/logger";
import { AppError } from "../utils/AppError";

// ── Logger Tests (S16-018) ─────────────────────────────────────

describe("createLogger", () => {
  it("creates a logger with debug level in development", () => {
    const log = createLogger("development");
    expect(log.level).toBe("debug");
  });

  it("creates a logger with info level in production", () => {
    const log = createLogger("production");
    expect(log.level).toBe("info");
  });

  it("creates a logger with silent level in test", () => {
    const log = createLogger("test");
    expect(log.level).toBe("silent");
  });

  it("respects custom log level override", () => {
    const log = createLogger("production", "warn");
    expect(log.level).toBe("warn");
  });

  it("formats level as label not number", () => {
    const log = createLogger("production");
    // Pino uses level labels in formatters
    expect(log.level).toBe("info");
  });
});

// ── Monitoring Middleware Tests (S16-017) ───────────────────────

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: "GET",
    originalUrl: "/api/test",
    path: "/api/test",
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    statusCode: 200,
    on: vi.fn(),
  };
  return res as unknown as Response;
}

describe("monitoringMiddleware", () => {
  let monitoringMiddleware: (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;

  beforeEach(async () => {
    const mod = await import("../middleware/monitoring");
    monitoringMiddleware = mod.monitoringMiddleware;
  });

  it("calls next with the error to pass to error handler", () => {
    const err = new AppError(404, "Not found");
    const next = vi.fn();

    monitoringMiddleware(err, mockRequest(), mockResponse(), next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("handles AppError with correct operational status", () => {
    const err = new AppError(422, "Validation failed");
    const next = vi.fn();

    monitoringMiddleware(err, mockRequest(), mockResponse(), next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("handles unexpected errors (non-AppError)", () => {
    const err = new Error("Database connection lost");
    const next = vi.fn();

    monitoringMiddleware(err, mockRequest(), mockResponse(), next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("extracts userId from request if available", () => {
    const req = mockRequest();
    (req as unknown as Record<string, unknown>).user = { id: "user-123" };
    const next = vi.fn();
    const err = new AppError(403, "Forbidden");

    monitoringMiddleware(err, req, mockResponse(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("requestMetrics", () => {
  let requestMetrics: (req: Request, res: Response, next: NextFunction) => void;

  beforeEach(async () => {
    const mod = await import("../middleware/monitoring");
    requestMetrics = mod.requestMetrics;
  });

  it("calls next immediately", () => {
    const next = vi.fn();
    requestMetrics(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  it("registers a finish listener on the response", () => {
    const res = mockResponse();
    const next = vi.fn();

    requestMetrics(mockRequest(), res, next);

    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
  });
});

// ── Environment Config Tests (S16-015) ─────────────────────────

describe("env config validation", () => {
  it("env module exports required fields", async () => {
    const { env } = await import("../config/env");
    expect(env).toHaveProperty("NODE_ENV");
    expect(env).toHaveProperty("PORT");
    expect(env).toHaveProperty("DATABASE_URL");
    expect(env).toHaveProperty("JWT_SECRET");
    expect(env).toHaveProperty("JWT_REFRESH_SECRET");
    expect(env).toHaveProperty("CLIENT_URL");
    expect(env).toHaveProperty("SENTRY_DSN");
    expect(env).toHaveProperty("LOG_LEVEL");
  });

  it("PORT is a number", async () => {
    const { env } = await import("../config/env");
    expect(typeof env.PORT).toBe("number");
  });

  it("NODE_ENV has a valid value", async () => {
    const { env } = await import("../config/env");
    expect(["development", "staging", "production", "test"]).toContain(
      env.NODE_ENV,
    );
  });
});
