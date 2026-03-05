import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import { getHealthStatus } from "../services/health.service";

describe("Health service", () => {
  it("returns ok status with uptime and timestamp", () => {
    const health = getHealthStatus();
    expect(health.status).toBe("ok");
    expect(typeof health.uptime).toBe("number");
    expect(health.uptime).toBeGreaterThanOrEqual(0);
    expect(health.timestamp).toBeDefined();
    expect(() => new Date(health.timestamp)).not.toThrow();
  });
});

describe("GET /api/health", () => {
  it("returns 200 with status ok, uptime, and timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(typeof res.body.data.uptime).toBe("number");
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.timestamp).toBeDefined();
  });

  it("does not require authentication", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});

describe("GET /health (legacy)", () => {
  it("returns 200 with status ok, uptime, and timestamp", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.timestamp).toBeDefined();
  });
});
