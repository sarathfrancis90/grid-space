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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock auth service for token verification
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
  spreadsheet: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Trash Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user lookup for auth middleware
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("DELETE /api/spreadsheets/:id (soft delete)", () => {
    it("soft-deletes a spreadsheet by setting deletedAt", async () => {
      // checkAccess mock
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        deletedAt: null,
        access: [],
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({
        id: "ss-1",
        deletedAt: new Date(),
      });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1")
        .set(authHeader);

      expect(res.status).toBe(204);
      expect(mockPrisma.spreadsheet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ss-1" },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    it("returns 403 for non-owner", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
        deletedAt: null,
        access: [{ role: "editor" }],
      });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1")
        .set(authHeader);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/spreadsheets/trash/list", () => {
    it("returns paginated list of trashed spreadsheets", async () => {
      const trashItems = [
        {
          id: "ss-1",
          title: "Deleted Sheet",
          deletedAt: new Date("2026-03-01"),
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-02-15"),
          owner: { id: "user-1", name: "Test User", avatarUrl: null },
        },
      ];

      mockPrisma.spreadsheet.findMany.mockResolvedValue(trashItems);
      mockPrisma.spreadsheet.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/spreadsheets/trash/list")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Deleted Sheet");
      expect(res.body.pagination.total).toBe(1);
    });

    it("returns empty list when no trashed spreadsheets", async () => {
      mockPrisma.spreadsheet.findMany.mockResolvedValue([]);
      mockPrisma.spreadsheet.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/spreadsheets/trash/list")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("POST /api/spreadsheets/:id/restore", () => {
    it("restores a trashed spreadsheet", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        deletedAt: new Date("2026-03-01"),
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({
        id: "ss-1",
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/restore")
        .set(authHeader);

      expect(res.status).toBe(204);
      expect(mockPrisma.spreadsheet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ss-1" },
          data: { deletedAt: null },
        }),
      );
    });

    it("returns 404 for spreadsheet not in trash", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        deletedAt: null,
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/restore")
        .set(authHeader);

      expect(res.status).toBe(404);
    });

    it("returns 403 for non-owner", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
        deletedAt: new Date("2026-03-01"),
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/restore")
        .set(authHeader);

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/spreadsheets/:id/permanent", () => {
    it("permanently deletes a trashed spreadsheet", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        deletedAt: new Date("2026-03-01"),
      });

      mockPrisma.spreadsheet.delete.mockResolvedValue({ id: "ss-1" });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/permanent")
        .set(authHeader);

      expect(res.status).toBe(204);
      expect(mockPrisma.spreadsheet.delete).toHaveBeenCalledWith({
        where: { id: "ss-1" },
      });
    });

    it("returns 403 when spreadsheet is not in trash", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        deletedAt: null,
      });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/permanent")
        .set(authHeader);

      expect(res.status).toBe(403);
    });

    it("returns 403 for non-owner", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
        deletedAt: new Date("2026-03-01"),
      });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/permanent")
        .set(authHeader);

      expect(res.status).toBe(403);
    });
  });

  describe("Normal listing excludes trashed items", () => {
    it("passes deletedAt: null in the where clause", async () => {
      mockPrisma.spreadsheet.findMany.mockResolvedValue([]);
      mockPrisma.spreadsheet.count.mockResolvedValue(0);

      await request(app).get("/api/spreadsheets").set(authHeader);

      expect(mockPrisma.spreadsheet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });
});
