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
    sheet: {
      findFirst: vi.fn(),
      update: vi.fn(),
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
  sheet: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Spreadsheet Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user lookup for auth middleware
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("GET /api/spreadsheets", () => {
    it("returns paginated spreadsheet list", async () => {
      const spreadsheets = [
        {
          id: "ss-1",
          title: "My Sheet",
          isStarred: false,
          isTemplate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user-1", name: "Test", avatarUrl: null },
          access: [{ role: "owner" }],
        },
      ];

      mockPrisma.spreadsheet.findMany.mockResolvedValue(spreadsheets);
      mockPrisma.spreadsheet.count.mockResolvedValue(1);

      const res = await request(app).get("/api/spreadsheets").set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/spreadsheets");
      expect(res.status).toBe(401);
    });

    it("supports filter parameter", async () => {
      mockPrisma.spreadsheet.findMany.mockResolvedValue([]);
      mockPrisma.spreadsheet.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/spreadsheets?filter=starred")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("supports search parameter", async () => {
      mockPrisma.spreadsheet.findMany.mockResolvedValue([]);
      mockPrisma.spreadsheet.count.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/spreadsheets?search=Budget")
        .set(authHeader);

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/spreadsheets/:id", () => {
    it("returns spreadsheet with sheets", async () => {
      // checkAccess call
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({
          ownerId: "user-1",
          access: [],
        })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "My Sheet",
          isStarred: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: "user-1",
            name: "Test",
            email: "test@example.com",
            avatarUrl: null,
          },
          sheets: [
            {
              id: "sheet-1",
              name: "Sheet 1",
              index: 0,
              color: null,
              isHidden: false,
              cellData: {},
              columnMeta: {},
              rowMeta: {},
              frozenRows: 0,
              frozenCols: 0,
              filterState: null,
              sortState: null,
            },
          ],
        });

      const res = await request(app)
        .get("/api/spreadsheets/ss-1")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("ss-1");
      expect(res.body.data.sheets).toHaveLength(1);
    });

    it("returns 404 for non-existent spreadsheet", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/spreadsheets/nonexistent")
        .set(authHeader);

      expect(res.status).toBe(404);
    });

    it("returns 403 when user has no access", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
        access: [],
      });

      const res = await request(app)
        .get("/api/spreadsheets/ss-1")
        .set(authHeader);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/spreadsheets", () => {
    it("creates a new spreadsheet", async () => {
      const created = {
        id: "ss-new",
        title: "New Sheet",
        isStarred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "Test",
          email: "test@example.com",
          avatarUrl: null,
        },
        sheets: [
          {
            id: "sheet-1",
            name: "Sheet 1",
            index: 0,
            color: null,
            isHidden: false,
            cellData: {},
            columnMeta: {},
            rowMeta: {},
            frozenRows: 0,
            frozenCols: 0,
            filterState: null,
            sortState: null,
          },
        ],
      };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({
            spreadsheet: { create: vi.fn().mockResolvedValue(created) },
          });
        },
      );

      const res = await request(app)
        .post("/api/spreadsheets")
        .set(authHeader)
        .send({ title: "New Sheet" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("New Sheet");
    });

    it("creates spreadsheet with default title", async () => {
      const created = {
        id: "ss-new",
        title: "Untitled Spreadsheet",
        isStarred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "Test",
          email: "test@example.com",
          avatarUrl: null,
        },
        sheets: [],
      };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({
            spreadsheet: { create: vi.fn().mockResolvedValue(created) },
          });
        },
      );

      const res = await request(app)
        .post("/api/spreadsheets")
        .set(authHeader)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Untitled Spreadsheet");
    });
  });

  describe("PUT /api/spreadsheets/:id", () => {
    it("updates spreadsheet title", async () => {
      // checkAccess
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({
        id: "ss-1",
        title: "Updated Title",
        isStarred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "Test",
          email: "test@example.com",
          avatarUrl: null,
        },
        sheets: [],
      });

      const res = await request(app)
        .put("/api/spreadsheets/ss-1")
        .set(authHeader)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/spreadsheets/:id", () => {
    it("deletes spreadsheet (owner)", async () => {
      // checkAccess
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.spreadsheet.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1")
        .set(authHeader);

      expect(res.status).toBe(204);
    });

    it("returns 403 for non-owner", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
        access: [{ role: "editor" }],
      });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1")
        .set(authHeader);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/spreadsheets/:id/star", () => {
    it("toggles star on spreadsheet", async () => {
      // checkAccess
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({
          ownerId: "user-1",
          access: [],
        })
        .mockResolvedValueOnce({
          isStarred: false,
        });

      mockPrisma.spreadsheet.update.mockResolvedValue({
        isStarred: true,
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/star")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.isStarred).toBe(true);
    });
  });

  describe("POST /api/spreadsheets/:id/duplicate", () => {
    it("duplicates a spreadsheet", async () => {
      // checkAccess
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({
          ownerId: "user-1",
          access: [],
        })
        .mockResolvedValueOnce({
          title: "Original",
          sheets: [
            {
              name: "Sheet 1",
              index: 0,
              color: null,
              cellData: { A1: { value: "test" } },
              columnMeta: {},
              rowMeta: {},
              frozenRows: 0,
              frozenCols: 0,
            },
          ],
        });

      const copy = {
        id: "ss-copy",
        title: "Original (Copy)",
        isStarred: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: "user-1",
          name: "Test",
          email: "test@example.com",
          avatarUrl: null,
        },
        sheets: [
          {
            id: "sheet-copy",
            name: "Sheet 1",
            index: 0,
            color: null,
            isHidden: false,
            cellData: { A1: { value: "test" } },
            columnMeta: {},
            rowMeta: {},
            frozenRows: 0,
            frozenCols: 0,
            filterState: null,
            sortState: null,
          },
        ],
      };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({
            spreadsheet: { create: vi.fn().mockResolvedValue(copy) },
          });
        },
      );

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/duplicate")
        .set(authHeader);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Original (Copy)");
    });
  });
});
