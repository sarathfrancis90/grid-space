import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: {
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
  sendWithAttachment: vi.fn().mockResolvedValue({
    success: true,
    messageId: "mock-msg-id",
  }),
  sendShareInvite: vi.fn(),
}));

import prisma from "../models/prisma";
import { sendWithAttachment } from "../services/email.service";

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
};

const mockSendWithAttachment = sendWithAttachment as ReturnType<typeof vi.fn>;

describe("POST /api/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  const validPayload = {
    recipients: ["recipient@example.com"],
    subject: "Test spreadsheet",
    message: "Here is the spreadsheet",
    format: "csv",
    spreadsheetData: {
      sheets: [
        {
          name: "Sheet1",
          cells: {
            "0,0": { value: "Hello" },
            "0,1": { value: 42 },
          },
        },
      ],
    },
  };

  it("sends email with attachment successfully", async () => {
    const res = await request(app)
      .post("/api/email")
      .set("Authorization", "Bearer valid-token")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toHaveLength(1);
    expect(res.body.data.sent[0].email).toBe("recipient@example.com");
    expect(res.body.data.sent[0].success).toBe(true);
    expect(mockSendWithAttachment).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/email").send(validPayload);

    expect(res.status).toBe(401);
  });

  it("validates required fields", async () => {
    const res = await request(app)
      .post("/api/email")
      .set("Authorization", "Bearer valid-token")
      .send({ recipients: [], subject: "", format: "csv" });

    expect(res.status).toBe(422);
  });

  it("rejects invalid email addresses", async () => {
    const res = await request(app)
      .post("/api/email")
      .set("Authorization", "Bearer valid-token")
      .send({
        ...validPayload,
        recipients: ["not-an-email"],
      });

    expect(res.status).toBe(422);
  });

  it("rejects invalid format", async () => {
    const res = await request(app)
      .post("/api/email")
      .set("Authorization", "Bearer valid-token")
      .send({
        ...validPayload,
        format: "pdf",
      });

    expect(res.status).toBe(422);
  });

  it("sends to multiple recipients", async () => {
    const res = await request(app)
      .post("/api/email")
      .set("Authorization", "Bearer valid-token")
      .send({
        ...validPayload,
        recipients: ["a@example.com", "b@example.com", "c@example.com"],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toHaveLength(3);
    expect(mockSendWithAttachment).toHaveBeenCalledTimes(3);
  });

  it("supports xlsx format", async () => {
    const res = await request(app)
      .post("/api/email")
      .set("Authorization", "Bearer valid-token")
      .send({
        ...validPayload,
        format: "xlsx",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
