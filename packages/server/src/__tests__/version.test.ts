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
      create: vi.fn(),
    },
    version: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    sheet: {
      deleteMany: vi.fn(),
      create: vi.fn(),
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
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  version: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  sheet: {
    deleteMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const authHeader = { Authorization: "Bearer valid-test-token" };

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
};

describe("Version History API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  describe("GET /api/spreadsheets/:id/versions (S13-015)", () => {
    it("should list versions with pagination", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      const mockVersions = [
        {
          id: "v1",
          name: "Release 1",
          createdAt: new Date("2026-02-26T10:00:00Z"),
          changeset: { sheetChanges: [] },
          createdBy: {
            id: "user-1",
            name: "Test User",
            avatarUrl: null,
          },
        },
        {
          id: "v2",
          name: null,
          createdAt: new Date("2026-02-26T09:00:00Z"),
          changeset: null,
          createdBy: {
            id: "user-1",
            name: "Test User",
            avatarUrl: null,
          },
        },
      ];

      mockPrisma.version.findMany.mockResolvedValue(mockVersions);
      mockPrisma.version.count.mockResolvedValue(2);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/versions?page=1&limit=20")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe("v1");
      expect(res.body.data[0].name).toBe("Release 1");
      expect(res.body.data[0].hasChangeset).toBe(true);
      expect(res.body.data[1].hasChangeset).toBe(false);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/spreadsheets/ss-1/versions");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/spreadsheets/:id/versions/:versionId (S13-005)", () => {
    it("should return version with snapshot", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      const mockVersion = {
        id: "v1",
        name: "Release 1",
        snapshot: {
          title: "Test",
          sheets: [{ id: "s1", name: "Sheet1", cellData: {} }],
        },
        changeset: null,
        createdAt: new Date("2026-02-26T10:00:00Z"),
        createdBy: {
          id: "user-1",
          name: "Test User",
          avatarUrl: null,
        },
      };

      mockPrisma.version.findFirst.mockResolvedValue(mockVersion);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/versions/v1")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("v1");
      expect(res.body.data.snapshot).toBeDefined();
    });
  });

  describe("PUT /api/spreadsheets/:id/versions/:versionId/name (S13-007)", () => {
    it("should name a version", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.version.findFirst.mockResolvedValue({
        id: "v1",
        name: null,
      });

      mockPrisma.version.update.mockResolvedValue({
        id: "v1",
        name: "Q4 Budget Final",
        createdAt: new Date("2026-02-26T10:00:00Z"),
        changeset: null,
        createdBy: {
          id: "user-1",
          name: "Test User",
          avatarUrl: null,
        },
      });

      const res = await request(app)
        .put("/api/spreadsheets/ss-1/versions/v1/name")
        .set(authHeader)
        .send({ name: "Q4 Budget Final" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Q4 Budget Final");
    });

    it("should reject empty name", async () => {
      const res = await request(app)
        .put("/api/spreadsheets/ss-1/versions/v1/name")
        .set(authHeader)
        .send({ name: "" });

      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/spreadsheets/:id/versions/:versionId/diff (S13-008)", () => {
    it("should return diff between version and previous", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      const currentVersion = {
        snapshot: {
          sheets: [
            { id: "s1", name: "Sheet1", cellData: { A1: { value: "new" } } },
          ],
        },
        createdAt: new Date("2026-02-26T10:00:00Z"),
      };

      const prevVersion = {
        snapshot: {
          sheets: [
            { id: "s1", name: "Sheet1", cellData: { A1: { value: "old" } } },
          ],
        },
      };

      mockPrisma.version.findFirst
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(prevVersion);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/versions/v1/diff")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].sheetName).toBe("Sheet1");
      expect(res.body.data[0].changes).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/spreadsheets/:id/versions/grouped (S13-009)", () => {
    it("should return versions grouped by time period", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      const now = new Date();
      mockPrisma.version.findMany.mockResolvedValue([
        {
          id: "v1",
          name: null,
          createdAt: now,
          changeset: null,
          createdBy: { id: "user-1", name: "Test User", avatarUrl: null },
        },
      ]);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/versions/grouped")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0]).toHaveProperty("period");
      expect(res.body.data[0]).toHaveProperty("versions");
    });
  });

  describe("POST /api/spreadsheets/:id/versions/:versionId/copy (S13-011)", () => {
    it("should copy a version as new spreadsheet", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.version.findFirst.mockResolvedValue({
        id: "v1",
        name: "Final",
        snapshot: {
          title: "Q4 Budget",
          sheets: [
            {
              name: "Sheet1",
              index: 0,
              color: null,
              cellData: { A1: { value: 100 } },
              columnMeta: {},
              rowMeta: {},
              frozenRows: 0,
              frozenCols: 0,
            },
          ],
        },
      });

      const newSpreadsheet = {
        id: "new-ss-1",
        title: "Q4 Budget (Version: Final)",
      };
      mockPrisma.$transaction.mockResolvedValue(newSpreadsheet);

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/versions/v1/copy")
        .set(authHeader);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("new-ss-1");
    });
  });
});
