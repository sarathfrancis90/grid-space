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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    commentReply: {
      create: vi.fn(),
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
  comment: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  commentReply: { create: ReturnType<typeof vi.fn> };
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Comment Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("GET /api/spreadsheets/:id/comments", () => {
    it("returns comment list", async () => {
      // checkAccess
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.comment.findMany.mockResolvedValue([
        {
          id: "c-1",
          spreadsheetId: "ss-1",
          sheetId: "sh-1",
          cellKey: "A1",
          text: "Test comment",
          resolved: false,
          mentions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: "user-1",
            name: "Test",
            email: "test@example.com",
            avatarUrl: null,
          },
          replies: [],
        },
      ]);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/comments")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/spreadsheets/ss-1/comments");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/spreadsheets/:id/comments", () => {
    it("creates a comment", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      const newComment = {
        id: "c-new",
        spreadsheetId: "ss-1",
        sheetId: "sh-1",
        cellKey: "A1",
        text: "New comment",
        resolved: false,
        mentions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "user-1",
          name: "Test",
          email: "test@example.com",
          avatarUrl: null,
        },
        replies: [],
      };

      mockPrisma.comment.create.mockResolvedValue(newComment);

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/comments")
        .set(authHeader)
        .send({ sheetId: "sh-1", cellKey: "A1", text: "New comment" });

      expect(res.status).toBe(201);
      expect(res.body.data.text).toBe("New comment");
    });

    it("rejects missing text", async () => {
      const res = await request(app)
        .post("/api/spreadsheets/ss-1/comments")
        .set(authHeader)
        .send({ sheetId: "sh-1", cellKey: "A1" });

      expect(res.status).toBe(422);
    });
  });

  describe("PUT /api/spreadsheets/:id/comments/:commentId/resolve", () => {
    it("resolves a comment", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "c-1",
        spreadsheetId: "ss-1",
      });

      const resolved = {
        id: "c-1",
        spreadsheetId: "ss-1",
        sheetId: "sh-1",
        cellKey: "A1",
        text: "Test",
        resolved: true,
        mentions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "user-1",
          name: "Test",
          email: "test@example.com",
          avatarUrl: null,
        },
        replies: [],
      };

      mockPrisma.comment.update.mockResolvedValue(resolved);

      const res = await request(app)
        .put("/api/spreadsheets/ss-1/comments/c-1/resolve")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.resolved).toBe(true);
    });
  });

  describe("DELETE /api/spreadsheets/:id/comments/:commentId", () => {
    it("deletes a comment", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "c-1",
        authorId: "user-1",
        spreadsheetId: "ss-1",
      });

      mockPrisma.comment.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/comments/c-1")
        .set(authHeader);

      expect(res.status).toBe(204);
    });
  });
});
