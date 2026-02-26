import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, apiPaginated } from "../utils/apiResponse";

describe("apiSuccess", () => {
  it("wraps data in success envelope", () => {
    const result = apiSuccess({ id: "123", name: "Test" });
    expect(result).toEqual({
      success: true,
      data: { id: "123", name: "Test" },
    });
  });

  it("works with array data", () => {
    const result = apiSuccess([1, 2, 3]);
    expect(result).toEqual({ success: true, data: [1, 2, 3] });
  });

  it("works with null data", () => {
    const result = apiSuccess(null);
    expect(result).toEqual({ success: true, data: null });
  });

  it("works with string data", () => {
    const result = apiSuccess("hello");
    expect(result).toEqual({ success: true, data: "hello" });
  });
});

describe("apiError", () => {
  it("formats error response correctly", () => {
    const result = apiError(404, "Not found");
    expect(result).toEqual({
      success: false,
      error: { code: 404, message: "Not found" },
    });
  });

  it("formats 500 error", () => {
    const result = apiError(500, "Internal server error");
    expect(result).toEqual({
      success: false,
      error: { code: 500, message: "Internal server error" },
    });
  });

  it("formats 422 validation error", () => {
    const result = apiError(422, "Validation failed");
    expect(result).toEqual({
      success: false,
      error: { code: 422, message: "Validation failed" },
    });
  });
});

describe("apiPaginated", () => {
  it("formats paginated response correctly", () => {
    const data = [{ id: "1" }, { id: "2" }];
    const result = apiPaginated(data, 1, 20, 42);
    expect(result).toEqual({
      success: true,
      data,
      pagination: {
        page: 1,
        limit: 20,
        total: 42,
        totalPages: 3,
      },
    });
  });

  it("calculates totalPages correctly for exact division", () => {
    const result = apiPaginated([], 1, 10, 30);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("calculates totalPages correctly for partial last page", () => {
    const result = apiPaginated([], 1, 10, 31);
    expect(result.pagination.totalPages).toBe(4);
  });

  it("handles zero total", () => {
    const result = apiPaginated([], 1, 20, 0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("handles single item", () => {
    const result = apiPaginated([{ id: "1" }], 1, 20, 1);
    expect(result.pagination.totalPages).toBe(1);
  });
});
