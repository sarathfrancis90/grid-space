import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../models/prisma", () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

import { app } from "../app";
import prisma from "../models/prisma";

const mockPrisma = vi.mocked(prisma);

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with status ok when database is connected", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.database).toBe("connected");
    expect(res.body.data.uptime).toBeTypeOf("number");
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.timestamp).toBeDefined();
  });

  it("returns 503 with status error when database is disconnected", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("error");
    expect(res.body.data.database).toBe("disconnected");
    expect(res.body.data.uptime).toBeTypeOf("number");
    expect(res.body.data.timestamp).toBeDefined();
  });

  it("does not require authentication", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const res = await request(app).get("/api/health");

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
