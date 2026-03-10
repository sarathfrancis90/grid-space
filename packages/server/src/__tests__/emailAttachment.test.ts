import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: { findUnique: vi.fn() },
    spreadsheet: { findUnique: vi.fn() },
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock auth
vi.mock(
  "../services/auth.service",
  async (importOriginal: () => Promise<Record<string, unknown>>) => {
    const actual = await importOriginal();
    return {
      ...actual,
      verifyAccessToken: vi.fn().mockReturnValue({
        userId: "user-1",
        email: "test@example.com",
      }),
    };
  },
);

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue(null),
  },
}));

import prisma from "../models/prisma";

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  spreadsheet: { findUnique: ReturnType<typeof vi.fn> };
};

const AUTH_HEADER = "Bearer valid-token";

describe("POST /api/spreadsheets/:id/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user exists
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .send({
        recipients: ["recipient@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
      });

    expect(res.status).toBe(401);
  });

  it("returns 422 with invalid body (empty recipients)", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: [],
        subject: "Test",
        message: "",
        format: "csv",
      });

    expect(res.status).toBe(422);
  });

  it("returns 422 with invalid format", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: ["a@b.com"],
        subject: "Test",
        message: "",
        format: "docx",
      });

    expect(res.status).toBe(422);
  });

  it("returns 422 with invalid email in recipients", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: ["not-an-email"],
        subject: "Test",
        message: "",
        format: "csv",
      });

    expect(res.status).toBe(422);
  });

  it("returns 404 when spreadsheet not found", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: ["recipient@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
      });

    expect(res.status).toBe(404);
  });

  it("returns 403 when user has no access", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      id: "sp-1",
      title: "My Sheet",
      ownerId: "other-user",
      deletedAt: null,
      access: [],
      sheets: [],
    });

    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: ["recipient@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
      });

    expect(res.status).toBe(403);
  });

  it("returns 200 when user is owner (SMTP not configured)", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      id: "sp-1",
      title: "My Sheet",
      ownerId: "user-1",
      deletedAt: null,
      access: [],
      sheets: [
        {
          name: "Sheet1",
          cellData: { "0,0": { value: "Hello" }, "0,1": { value: "World" } },
        },
      ],
    });

    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        message: "Here is the file",
        format: "csv",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toBe(true);
  });

  it("returns 200 when user has viewer access", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      id: "sp-1",
      title: "Shared Sheet",
      ownerId: "other-user",
      deletedAt: null,
      access: [{ role: "viewer" }],
      sheets: [{ name: "Sheet1", cellData: {} }],
    });

    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: ["a@b.com"],
        subject: "Sharing",
        message: "",
        format: "pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 422 when more than 10 recipients", async () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => `user${i}@test.com`);

    const res = await request(app)
      .post("/api/spreadsheets/sp-1/email")
      .set("Authorization", AUTH_HEADER)
      .send({
        recipients: tooMany,
        subject: "Test",
        message: "",
        format: "csv",
      });

    expect(res.status).toBe(422);
  });
});
