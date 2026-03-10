import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    folder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    spreadsheet: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock auth service
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
  folder: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  spreadsheet: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Folder Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      tokenVersion: 0,
    });
  });

  describe("GET /api/folders", () => {
    it("should list root folders", async () => {
      mockPrisma.folder.findMany.mockResolvedValue([
        {
          id: "folder-1",
          name: "Work",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { children: 2, spreadsheets: 3 },
        },
        {
          id: "folder-2",
          name: "Personal",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { children: 0, spreadsheets: 1 },
        },
      ]);

      const res = await request(app)
        .get("/api/folders")
        .set(authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe("Work");
    });

    it("should list folders by parentId", async () => {
      mockPrisma.folder.findMany.mockResolvedValue([
        {
          id: "folder-3",
          name: "Sub-folder",
          parentId: "folder-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { children: 0, spreadsheets: 0 },
        },
      ]);

      const res = await request(app)
        .get("/api/folders?parentId=folder-1")
        .set(authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].parentId).toBe("folder-1");
    });
  });

  describe("POST /api/folders", () => {
    it("should create a folder", async () => {
      mockPrisma.folder.create.mockResolvedValue({
        id: "folder-new",
        name: "New Folder",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { children: 0, spreadsheets: 0 },
      });

      const res = await request(app)
        .post("/api/folders")
        .set(authHeader)
        .send({ name: "New Folder" })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Folder");
    });

    it("should create a folder with parentId", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({
        userId: "user-1",
      });

      mockPrisma.folder.create.mockResolvedValue({
        id: "folder-sub",
        name: "Sub",
        parentId: "folder-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { children: 0, spreadsheets: 0 },
      });

      const res = await request(app)
        .post("/api/folders")
        .set(authHeader)
        .send({ name: "Sub", parentId: "folder-1" })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Sub");
    });

    it("should reject empty name", async () => {
      await request(app)
        .post("/api/folders")
        .set(authHeader)
        .send({ name: "" })
        .expect(422);
    });
  });

  describe("PUT /api/folders/:id", () => {
    it("should rename a folder", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({
        userId: "user-1",
      });

      mockPrisma.folder.update.mockResolvedValue({
        id: "folder-1",
        name: "Renamed",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { children: 0, spreadsheets: 0 },
      });

      const res = await request(app)
        .put("/api/folders/folder-1")
        .set(authHeader)
        .send({ name: "Renamed" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Renamed");
    });

    it("should deny access to another user's folder", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({
        userId: "other-user",
      });

      await request(app)
        .put("/api/folders/folder-1")
        .set(authHeader)
        .send({ name: "Hack" })
        .expect(403);
    });
  });

  describe("DELETE /api/folders/:id", () => {
    it("should delete a folder", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({
        userId: "user-1",
      });

      mockPrisma.folder.delete.mockResolvedValue({});

      await request(app)
        .delete("/api/folders/folder-1")
        .set(authHeader)
        .expect(204);
    });

    it("should deny deleting another user's folder", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({
        userId: "other-user",
      });

      await request(app)
        .delete("/api/folders/folder-1")
        .set(authHeader)
        .expect(403);
    });
  });

  describe("POST /api/folders/move-spreadsheet", () => {
    it("should move a spreadsheet to a folder", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.folder.findUnique.mockResolvedValue({
        userId: "user-1",
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/folders/move-spreadsheet")
        .set(authHeader)
        .send({ spreadsheetId: "ss-1", folderId: "folder-1" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.moved).toBe(true);
    });

    it("should move a spreadsheet to root (null folderId)", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/folders/move-spreadsheet")
        .set(authHeader)
        .send({ spreadsheetId: "ss-1", folderId: null })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.moved).toBe(true);
    });

    it("should deny non-owner from moving a spreadsheet", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
      });

      await request(app)
        .post("/api/folders/move-spreadsheet")
        .set(authHeader)
        .send({ spreadsheetId: "ss-1", folderId: "folder-1" })
        .expect(403);
    });
  });
});
