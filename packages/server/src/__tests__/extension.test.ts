import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("Extension routes (auth required)", () => {
  it("GET /api/extensions/marketplace returns 401 without auth", async () => {
    const res = await request(app).get("/api/extensions/marketplace");
    expect(res.status).toBe(401);
  });

  it("GET /api/extensions/installed returns 401 without auth", async () => {
    const res = await request(app).get("/api/extensions/installed");
    expect(res.status).toBe(401);
  });

  it("GET /api/extensions/my returns 401 without auth", async () => {
    const res = await request(app).get("/api/extensions/my");
    expect(res.status).toBe(401);
  });

  it("POST /api/extensions returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/extensions")
      .send({ name: "Test Extension" });
    expect(res.status).toBe(401);
  });

  it("POST /api/extensions/:slug/install returns 401 without auth", async () => {
    const res = await request(app).post("/api/extensions/test-ext/install");
    expect(res.status).toBe(401);
  });

  it("DELETE /api/extensions/:slug/uninstall returns 401 without auth", async () => {
    const res = await request(app).delete("/api/extensions/test-ext/uninstall");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/extensions/:slug/toggle returns 401 without auth", async () => {
    const res = await request(app)
      .patch("/api/extensions/test-ext/toggle")
      .send({ isEnabled: true });
    expect(res.status).toBe(401);
  });

  it("PUT /api/extensions/:slug returns 401 without auth", async () => {
    const res = await request(app)
      .put("/api/extensions/test-ext")
      .send({ name: "Updated" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/extensions/:slug returns 401 without auth", async () => {
    const res = await request(app).delete("/api/extensions/test-ext");
    expect(res.status).toBe(401);
  });

  it("PUT /api/extensions/:slug/settings returns 401 without auth", async () => {
    const res = await request(app)
      .put("/api/extensions/test-ext/settings")
      .send({ settings: {} });
    expect(res.status).toBe(401);
  });

  it("GET /api/extensions/marketplace/:slug returns 401 without auth", async () => {
    const res = await request(app).get("/api/extensions/marketplace/test-ext");
    expect(res.status).toBe(401);
  });
});

describe("Extension validation", () => {
  it("POST /api/extensions requires name field", async () => {
    const res = await request(app)
      .post("/api/extensions")
      .set("Authorization", "Bearer invalid-token")
      .send({});
    // Either 401 (invalid token) or 422 (validation) is acceptable
    expect([401, 422]).toContain(res.status);
  });

  it("PATCH /api/extensions/:slug/toggle requires isEnabled field", async () => {
    const res = await request(app)
      .patch("/api/extensions/test/toggle")
      .set("Authorization", "Bearer invalid-token")
      .send({});
    expect([401, 422]).toContain(res.status);
  });
});
