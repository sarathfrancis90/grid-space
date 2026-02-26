import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "../middleware/error.middleware";
import { AppError } from "../utils/AppError";
import { sanitize } from "../middleware/sanitize.middleware";

function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: "GET",
    path: "/test",
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

describe("errorHandler", () => {
  it("returns correct status for AppError", () => {
    const res = mockResponse();
    const next = vi.fn();
    const err = new AppError(404, "Not found");

    errorHandler(err, mockRequest(), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 404, message: "Not found" },
    });
  });

  it("returns 403 for forbidden errors", () => {
    const res = mockResponse();
    const next = vi.fn();
    const err = new AppError(403, "Access denied");

    errorHandler(err, mockRequest(), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 403, message: "Access denied" },
    });
  });

  it("returns 500 for unknown errors", () => {
    const res = mockResponse();
    const next = vi.fn();
    const err = new Error("Something broke");

    errorHandler(err, mockRequest(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 500, message: "Internal server error" },
    });
  });

  it("does not expose internal error details", () => {
    const res = mockResponse();
    const next = vi.fn();
    const err = new Error("DB connection string leaked");

    errorHandler(err, mockRequest(), res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.error.message).toBe("Internal server error");
    expect(jsonCall.error.message).not.toContain("DB connection");
  });
});

describe("notFoundHandler", () => {
  it("returns 404 with route info", () => {
    const req = mockRequest({ method: "GET", path: "/api/nonexistent" });
    const res = mockResponse();
    const next = vi.fn();

    notFoundHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 404,
        message: "Route not found: GET /api/nonexistent",
      },
    });
  });
});

describe("sanitize middleware", () => {
  it("strips HTML tags from body strings", () => {
    const req = mockRequest({
      body: { name: "<script>alert('xss')</script>Hello" },
    });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    sanitize(req, res, next);

    expect(req.body.name).toBe("alert('xss')Hello");
    expect(next).toHaveBeenCalled();
  });

  it("strips nested HTML tags", () => {
    const req = mockRequest({
      body: { data: { title: "<b>Bold</b> text" } },
    });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    sanitize(req, res, next);

    expect(req.body.data.title).toBe("Bold text");
  });

  it("leaves non-HTML strings unchanged", () => {
    const req = mockRequest({ body: { name: "Plain text" } });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    sanitize(req, res, next);

    expect(req.body.name).toBe("Plain text");
  });

  it("handles arrays", () => {
    const req = mockRequest({
      body: { tags: ["<b>one</b>", "<i>two</i>"] },
    });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    sanitize(req, res, next);

    expect(req.body.tags).toEqual(["one", "two"]);
  });

  it("preserves non-string values", () => {
    const req = mockRequest({ body: { count: 42, active: true } });
    const res = mockResponse();
    const next: NextFunction = vi.fn();

    sanitize(req, res, next);

    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
  });
});

describe("AppError", () => {
  it("is an instance of Error", () => {
    const err = new AppError(404, "Not found");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("has correct properties", () => {
    const err = new AppError(422, "Validation failed");
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Validation failed");
    expect(err.name).toBe("AppError");
    expect(err.isOperational).toBe(true);
  });
});
