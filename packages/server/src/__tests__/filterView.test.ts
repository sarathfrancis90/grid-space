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
    filterView: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
  spreadsheet: { findUnique: ReturnType<typeof vi.fn> };
  filterView: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("FilterView Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });

    // Mock spreadsheet access check
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      deletedAt: null,
      access: [],
    });
  });

  describe("GET /api/spreadsheets/:id/sheets/:sheetId/filter-views", () => {
    it("returns list of filter views", async () => {
      const filterViews = [
        {
          id: "fv-1",
          spreadsheetId: "ss-1",
          sheetId: "sheet-1",
          userId: "user-1",
          name: "My Filter",
          criteria: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.filterView.findMany.mockResolvedValue(filterViews);

      const res = await request(app)
        .get("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("My Filter");
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get(
        "/api/spreadsheets/ss-1/sheets/sheet-1/filter-views",
      );

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/spreadsheets/:id/sheets/:sheetId/filter-views", () => {
    it("creates a new filter view", async () => {
      const newView = {
        id: "fv-2",
        spreadsheetId: "ss-1",
        sheetId: "sheet-1",
        userId: "user-1",
        name: "New Filter",
        criteria: [{ col: 0, condition: { op: "equals", value: "test" } }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.filterView.create.mockResolvedValue(newView);

      const res = await request(app)
        .post("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views")
        .set(authHeader)
        .send({
          name: "New Filter",
          criteria: [{ col: 0, condition: { op: "equals", value: "test" } }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Filter");
    });

    it("returns 422 for invalid body", async () => {
      const res = await request(app)
        .post("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views")
        .set(authHeader)
        .send({ name: "" });

      expect(res.status).toBe(422);
    });
  });

  describe("PUT /api/spreadsheets/:id/sheets/:sheetId/filter-views/:filterViewId", () => {
    it("updates a filter view name", async () => {
      mockPrisma.filterView.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.filterView.update.mockResolvedValue({
        id: "fv-1",
        name: "Updated Name",
        spreadsheetId: "ss-1",
        sheetId: "sheet-1",
        userId: "user-1",
        criteria: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .put("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views/fv-1")
        .set(authHeader)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("returns 403 when editing another user's filter view", async () => {
      mockPrisma.filterView.findUnique.mockResolvedValue({
        userId: "other-user",
      });

      const res = await request(app)
        .put("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views/fv-1")
        .set(authHeader)
        .send({ name: "Hijack" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/spreadsheets/:id/sheets/:sheetId/filter-views/:filterViewId", () => {
    it("deletes a filter view", async () => {
      mockPrisma.filterView.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.filterView.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views/fv-1")
        .set(authHeader);

      expect(res.status).toBe(204);
    });

    it("returns 404 for nonexistent filter view", async () => {
      mockPrisma.filterView.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/spreadsheets/ss-1/sheets/sheet-1/filter-views/fv-999")
        .set(authHeader);

      expect(res.status).toBe(404);
    });
  });
});
