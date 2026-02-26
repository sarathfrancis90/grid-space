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
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    spreadsheetAccess: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
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
  spreadsheet: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  spreadsheetAccess: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Sharing Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Auth middleware user lookup
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("GET /api/spreadsheets/:id/access", () => {
    it("returns collaborator list", async () => {
      // checkUserRole
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.spreadsheetAccess.findMany.mockResolvedValue([
        {
          id: "access-1",
          userId: "user-1",
          role: "owner",
          createdAt: new Date(),
          user: {
            id: "user-1",
            name: "Owner",
            email: "owner@test.com",
            avatarUrl: null,
          },
        },
        {
          id: "access-2",
          userId: "user-2",
          role: "editor",
          createdAt: new Date(),
          user: {
            id: "user-2",
            name: "Editor",
            email: "editor@test.com",
            avatarUrl: null,
          },
        },
      ]);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/access")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/spreadsheets/ss-1/access");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/spreadsheets/:id/access", () => {
    it("adds a collaborator", async () => {
      // requireEditor
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      // Auth middleware fires twice (spreadsheet router + sharing router),
      // then addCollaborator looks up target user by email
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "user-1",
          email: "test@example.com",
          name: "Test",
        })
        .mockResolvedValueOnce({
          id: "user-1",
          email: "test@example.com",
          name: "Test",
        })
        .mockResolvedValueOnce({
          id: "user-2",
          name: "New User",
          email: "new@test.com",
          avatarUrl: null,
        });

      // Check existing access
      mockPrisma.spreadsheetAccess.findUnique.mockResolvedValue(null);

      // Create access
      mockPrisma.spreadsheetAccess.create.mockResolvedValue({
        id: "access-new",
        userId: "user-2",
        role: "editor",
        createdAt: new Date(),
        user: {
          id: "user-2",
          name: "New User",
          email: "new@test.com",
          avatarUrl: null,
        },
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/access")
        .set(authHeader)
        .send({ email: "new@test.com", role: "editor" });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe("editor");
    });

    it("rejects invalid role", async () => {
      const res = await request(app)
        .post("/api/spreadsheets/ss-1/access")
        .set(authHeader)
        .send({ email: "test@test.com", role: "admin" });

      expect(res.status).toBe(422);
    });
  });

  describe("PUT /api/spreadsheets/:id/access/:userId", () => {
    it("changes a collaborator role", async () => {
      // requireOwner
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheetAccess.findUnique.mockResolvedValue({
        id: "access-2",
        userId: "user-2",
        role: "viewer",
      });

      mockPrisma.spreadsheetAccess.update.mockResolvedValue({
        id: "access-2",
        userId: "user-2",
        role: "editor",
        createdAt: new Date(),
        user: {
          id: "user-2",
          name: "User 2",
          email: "u2@test.com",
          avatarUrl: null,
        },
      });

      const res = await request(app)
        .put("/api/spreadsheets/ss-1/access/user-2")
        .set(authHeader)
        .send({ role: "editor" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("editor");
    });
  });

  describe("DELETE /api/spreadsheets/:id/access/:userId", () => {
    it("removes a collaborator", async () => {
      // requireOwner
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheetAccess.findUnique.mockResolvedValue({
        id: "access-2",
        userId: "user-2",
        role: "editor",
      });

      mockPrisma.spreadsheetAccess.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/access/user-2")
        .set(authHeader);

      expect(res.status).toBe(204);
    });

    it("cannot remove the owner", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheetAccess.findUnique.mockResolvedValue({
        id: "access-1",
        userId: "user-1",
        role: "owner",
      });

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/access/user-1")
        .set(authHeader);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/spreadsheets/:id/share-link", () => {
    it("creates a share link", async () => {
      // requireOwner
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({
        shareLink: "abc123token",
        shareLinkRole: "viewer",
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/share-link")
        .set(authHeader)
        .send({ role: "viewer" });

      expect(res.status).toBe(200);
      expect(res.body.data.shareLink).toBeDefined();
      expect(res.body.data.shareLinkRole).toBe("viewer");
    });
  });

  describe("DELETE /api/spreadsheets/:id/share-link", () => {
    it("disables share link", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/share-link")
        .set(authHeader);

      expect(res.status).toBe(204);
    });
  });

  describe("GET /api/share/:token", () => {
    it("returns spreadsheet info for valid share link", async () => {
      mockPrisma.spreadsheet.findFirst.mockResolvedValue({
        id: "ss-1",
        shareLinkRole: "viewer",
      });

      const res = await request(app)
        .get("/api/share/validtoken123")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.spreadsheetId).toBe("ss-1");
      expect(res.body.data.role).toBe("viewer");
    });

    it("returns 404 for invalid token", async () => {
      mockPrisma.spreadsheet.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/share/invalidtoken")
        .set(authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/spreadsheets/:id/publish", () => {
    it("publishes to web", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
      });

      mockPrisma.spreadsheet.update.mockResolvedValue({
        publishedUrl: "pub-token-123",
      });

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/publish")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.publishedUrl).toBeDefined();
    });
  });
});
