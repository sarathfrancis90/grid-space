import { describe, it, expect } from "vitest";
import { app } from "../app";

describe("Express app", () => {
  it("is defined", () => {
    expect(app).toBeDefined();
  });

  it("is an Express application", () => {
    expect(typeof app.listen).toBe("function");
    expect(typeof app.get).toBe("function");
    expect(typeof app.use).toBe("function");
  });
});
