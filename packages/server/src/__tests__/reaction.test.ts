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
    comment: {
      findUnique: vi.fn(),
    },
    commentReaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock auth for token verification
vi.mock("../services/auth.service", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    verifyAccessToken: vi.fn().mockReturnValue({
      userId: "user-1",
      email: "test@example.com",
    }),
  };
});

import prisma from "../models/prisma";

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  spreadsheet: { findUnique: ReturnType<typeof vi.fn> };
  comment: { findUnique: ReturnType<typeof vi.fn> };
  commentReaction: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Reaction Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("POST /api/spreadsheets/:id/comments/:commentId/reactions", () => {
    it("adds a reaction (toggle on)", async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "c-1",
        spreadsheetId: "ss-1",
      });
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });
      mockPrisma.commentReaction.findUnique.mockResolvedValue(null);
      mockPrisma.commentReaction.create.mockResolvedValue({
        id: "cr-1",
        commentId: "c-1",
        userId: "user-1",
        emoji: "\u{1F44D}",
      });
      mockPrisma.commentReaction.findMany.mockResolvedValue([
        { emoji: "\u{1F44D}", userId: "user-1" },
      ]);

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/comments/c-1/reactions")
        .set(authHeader)
        .send({ emoji: "\u{1F44D}" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.added).toBe(true);
      expect(res.body.data.reactions).toHaveLength(1);
      expect(res.body.data.reactions[0].emoji).toBe("\u{1F44D}");
    });

    it("removes a reaction (toggle off)", async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "c-1",
        spreadsheetId: "ss-1",
      });
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });
      mockPrisma.commentReaction.findUnique.mockResolvedValue({
        id: "cr-1",
        commentId: "c-1",
        userId: "user-1",
        emoji: "\u{1F44D}",
      });
      mockPrisma.commentReaction.delete.mockResolvedValue({});
      mockPrisma.commentReaction.findMany.mockResolvedValue([]);

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/comments/c-1/reactions")
        .set(authHeader)
        .send({ emoji: "\u{1F44D}" });

      expect(res.status).toBe(200);
      expect(res.body.data.added).toBe(false);
      expect(res.body.data.reactions).toHaveLength(0);
    });

    it("rejects missing emoji", async () => {
      const res = await request(app)
        .post("/api/spreadsheets/ss-1/comments/c-1/reactions")
        .set(authHeader)
        .send({});

      expect(res.status).toBe(422);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app)
        .post("/api/spreadsheets/ss-1/comments/c-1/reactions")
        .send({ emoji: "\u{1F44D}" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/spreadsheets/:id/comments/:commentId/reactions", () => {
    it("returns aggregated reactions", async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "c-1",
        spreadsheetId: "ss-1",
      });
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });
      mockPrisma.commentReaction.findMany.mockResolvedValue([
        { emoji: "\u{1F44D}", userId: "user-1" },
        { emoji: "\u{1F44D}", userId: "user-2" },
        { emoji: "\u{2764}\u{FE0F}", userId: "user-1" },
      ]);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/comments/c-1/reactions")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });
});
