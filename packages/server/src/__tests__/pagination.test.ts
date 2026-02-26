import { describe, it, expect } from "vitest";
import { getPaginationParams } from "../utils/pagination";

describe("getPaginationParams", () => {
  it("returns defaults when no params provided", () => {
    const result = getPaginationParams({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("parses page and limit correctly", () => {
    const result = getPaginationParams({ page: "3", limit: "10" });
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("clamps page to minimum of 1", () => {
    const result = getPaginationParams({ page: "0" });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it("clamps negative page to 1", () => {
    const result = getPaginationParams({ page: "-5" });
    expect(result.page).toBe(1);
  });

  it("clamps limit to minimum of 1", () => {
    const result = getPaginationParams({ limit: "0" });
    expect(result.limit).toBe(1);
  });

  it("clamps limit to maximum of 100", () => {
    const result = getPaginationParams({ limit: "500" });
    expect(result.limit).toBe(100);
  });

  it("handles non-numeric page gracefully", () => {
    const result = getPaginationParams({ page: "abc" });
    expect(result.page).toBe(1);
  });

  it("handles non-numeric limit gracefully", () => {
    const result = getPaginationParams({ limit: "xyz" });
    expect(result.limit).toBe(20);
  });

  it("calculates skip correctly", () => {
    const result = getPaginationParams({ page: "5", limit: "25" });
    expect(result.skip).toBe(100);
  });
});
