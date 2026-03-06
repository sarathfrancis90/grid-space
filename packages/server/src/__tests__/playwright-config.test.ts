import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Playwright config", () => {
  const configPath = path.resolve(
    __dirname,
    "../../../../playwright.config.ts",
  );
  const configContent = fs.readFileSync(configPath, "utf-8");

  it("should define webServer as an array with both client and server", () => {
    expect(configContent).toContain("webServer: [");
  });

  it("should start the backend API server", () => {
    expect(configContent).toContain("npm run dev:server");
    expect(configContent).toContain("http://localhost:3001/health");
  });

  it("should start the frontend client", () => {
    expect(configContent).toContain("npm run dev:client");
    expect(configContent).toContain("http://localhost:5173");
  });
});
