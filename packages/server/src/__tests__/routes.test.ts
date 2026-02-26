import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("GET /health", () => {
  it("returns 200 with health info", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.environment).toBeDefined();
  });
});

describe("GET /api/health", () => {
  it("returns 200 with health info in API envelope", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.timestamp).toBeDefined();
  });
});

describe("GET /api/health/status", () => {
  it("returns 200 with feature counts", async () => {
    const res = await request(app).get("/api/health/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.app).toBe("GridSpace");
    expect(res.body.data.version).toBe("0.1.0");
    expect(res.body.data.features).toBeDefined();
    expect(res.body.data.features.total).toBeGreaterThan(0);
  });
});

describe("GET /api/docs", () => {
  it("returns API documentation", async () => {
    const res = await request(app).get("/api/docs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("GridSpace API");
    expect(res.body.data.endpoints).toBeInstanceOf(Array);
    expect(res.body.data.totalEndpoints).toBeGreaterThan(0);
  });
});

describe("Unknown routes", () => {
  it("returns 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toContain("Route not found");
  });

  it("returns 404 for unknown methods on known routes", async () => {
    const res = await request(app).patch("/api/health");
    expect(res.status).toBe(404);
  });
});

describe("API response envelope", () => {
  it("health endpoint uses success envelope", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
  });
});

describe("Spreadsheet routes (auth required)", () => {
  it("GET /api/spreadsheets returns 401 without auth", async () => {
    const res = await request(app).get("/api/spreadsheets");
    expect(res.status).toBe(401);
  });

  it("POST /api/spreadsheets returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/spreadsheets")
      .send({ title: "Test" });
    expect(res.status).toBe(401);
  });
});
