import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    spreadsheet: {
      findUnique: vi.fn(),
    },
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

// Mock email service
vi.mock("../services/email.service", () => ({
  sendSpreadsheetAttachment: vi
    .fn()
    .mockResolvedValue({ success: true, messageId: "msg-123" }),
  sendShareInvite: vi.fn(),
}));

import prisma from "../models/prisma";

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  spreadsheet: { findUnique: ReturnType<typeof vi.fn> };
};

const authHeader = { Authorization: "Bearer valid-test-token" };

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
};

const mockSpreadsheet = {
  id: "ss-1",
  title: "Test Spreadsheet",
  ownerId: "user-1",
  deletedAt: null,
  access: [],
  sheets: [
    {
      name: "Sheet1",
      cellData: {
        "0,0": { value: "Name" },
        "0,1": { value: "Age" },
        "1,0": { value: "Alice" },
        "1,1": { value: 30 },
      },
    },
  ],
};

describe("POST /api/spreadsheets/:id/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  it("should require authentication", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .send({
        recipients: ["recipient@example.com"],
        format: "csv",
      });

    expect(res.status).toBe(401);
  });

  it("should validate recipients are required", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({ format: "csv" });

    expect(res.status).toBe(422);
  });

  it("should validate email format", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: ["not-an-email"],
        format: "csv",
      });

    expect(res.status).toBe(422);
  });

  it("should validate format is csv or xlsx", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: ["user@example.com"],
        format: "pdf",
      });

    expect(res.status).toBe(422);
  });

  it("should reject more than 10 recipients", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: Array.from(
          { length: 11 },
          (_, i) => `user${i}@example.com`,
        ),
        format: "xlsx",
      });

    expect(res.status).toBe(422);
  });

  it("should send email with CSV attachment", async () => {
    // First call for checkViewerAccess, second for getting sheet data
    mockPrisma.spreadsheet.findUnique
      .mockResolvedValueOnce({
        ownerId: "user-1",
        deletedAt: null,
        access: [],
      })
      .mockResolvedValueOnce(mockSpreadsheet);

    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: ["recipient@example.com"],
        format: "csv",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toBe(1);
  });

  it("should send email with XLSX attachment", async () => {
    mockPrisma.spreadsheet.findUnique
      .mockResolvedValueOnce({
        ownerId: "user-1",
        deletedAt: null,
        access: [],
      })
      .mockResolvedValueOnce(mockSpreadsheet);

    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: ["recipient@example.com"],
        format: "xlsx",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toBe(1);
  });

  it("should send to multiple recipients", async () => {
    mockPrisma.spreadsheet.findUnique
      .mockResolvedValueOnce({
        ownerId: "user-1",
        deletedAt: null,
        access: [],
      })
      .mockResolvedValueOnce(mockSpreadsheet);

    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: ["a@example.com", "b@example.com"],
        format: "csv",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(2);
  });

  it("should deny access for non-owner/non-collaborator", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValueOnce({
      ownerId: "other-user",
      deletedAt: null,
      access: [],
    });

    const res = await request(app)
      .post("/api/spreadsheets/ss-1/email")
      .set(authHeader)
      .send({
        recipients: ["user@example.com"],
        format: "csv",
      });

    expect(res.status).toBe(403);
  });
});
