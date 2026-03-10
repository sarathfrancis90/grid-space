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
    spreadsheetAccess: {
      findFirst: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock auth for token verification
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
  sendWithAttachment: vi
    .fn()
    .mockResolvedValue({ success: true, messageId: "msg-123" }),
}));

import prisma from "../models/prisma";
import * as emailService from "../services/email.service";

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  spreadsheet: { findUnique: ReturnType<typeof vi.fn> };
  spreadsheetAccess: { findFirst: ReturnType<typeof vi.fn> };
};

const TOKEN = "Bearer valid-token";

describe("POST /api/spreadsheets/:id/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });

    mockPrisma.spreadsheetAccess.findFirst.mockResolvedValue({
      id: "access-1",
      spreadsheetId: "spreadsheet-1",
      userId: "user-1",
      role: "owner",
    });

    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      id: "spreadsheet-1",
      title: "My Spreadsheet",
    });
  });

  it("should send email with CSV attachment", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["recipient@example.com"],
        subject: "Test Spreadsheet",
        message: "Here is the spreadsheet",
        format: "csv",
        spreadsheetData: "A,B,C\n1,2,3",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toBe(1);
    expect(res.body.data.allSent).toBe(true);
    expect(emailService.sendWithAttachment).toHaveBeenCalledWith(
      "recipient@example.com",
      "Test Spreadsheet",
      "Here is the spreadsheet",
      expect.objectContaining({
        filename: "My Spreadsheet.csv",
        contentType: "text/csv",
      }),
      "Test User",
    );
  });

  it("should send to multiple recipients", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["a@example.com", "b@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(2);
    expect(res.body.data.total).toBe(2);
  });

  it("should reject request without auth", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .send({
        recipients: ["a@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(401);
  });

  it("should reject invalid email recipients", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["not-an-email"],
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(422);
  });

  it("should reject empty recipients array", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: [],
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(422);
  });

  it("should reject more than 10 recipients", async () => {
    const recipients = Array.from(
      { length: 11 },
      (_, i) => `user${i}@example.com`,
    );

    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients,
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(422);
  });

  it("should reject invalid format", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["a@example.com"],
        subject: "Test",
        message: "",
        format: "docx",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(422);
  });

  it("should reject when user has no access", async () => {
    mockPrisma.spreadsheetAccess.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["a@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(403);
  });

  it("should return 404 when spreadsheet not found", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["a@example.com"],
        subject: "Test",
        message: "",
        format: "csv",
        spreadsheetData: "data",
      });

    expect(res.status).toBe(404);
  });

  it("should handle xlsx format with base64 data", async () => {
    const res = await request(app)
      .post("/api/spreadsheets/spreadsheet-1/email")
      .set("Authorization", TOKEN)
      .send({
        recipients: ["a@example.com"],
        subject: "Test",
        message: "",
        format: "xlsx",
        spreadsheetData: "UEsDBBQ=", // minimal base64
      });

    expect(res.status).toBe(200);
    expect(emailService.sendWithAttachment).toHaveBeenCalledWith(
      "a@example.com",
      "Test",
      "",
      expect.objectContaining({
        filename: "My Spreadsheet.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Test User",
    );
  });
});
