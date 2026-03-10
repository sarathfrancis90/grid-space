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
    notificationRule: {
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
  notificationRule: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const authHeader = { Authorization: "Bearer valid-test-token" };
const spreadsheetId = "spreadsheet-1";

describe("Notification Rule Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      id: spreadsheetId,
      ownerId: "user-1",
      access: [],
    });
  });

  describe("GET /api/spreadsheets/:spreadsheetId/notification-rules", () => {
    it("returns notification rules for the spreadsheet", async () => {
      const rules = [
        {
          id: "rule-1",
          userId: "user-1",
          spreadsheetId,
          triggerType: "any_changes",
          triggerEmail: null,
          frequency: "immediately",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.notificationRule.findMany.mockResolvedValue(rules);

      const res = await request(app)
        .get(`/api/spreadsheets/${spreadsheetId}/notification-rules`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].triggerType).toBe("any_changes");
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get(
        `/api/spreadsheets/${spreadsheetId}/notification-rules`,
      );

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/spreadsheets/:spreadsheetId/notification-rules", () => {
    it("creates a notification rule", async () => {
      const created = {
        id: "rule-new",
        userId: "user-1",
        spreadsheetId,
        triggerType: "any_changes",
        triggerEmail: null,
        frequency: "immediately",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.notificationRule.create.mockResolvedValue(created);

      const res = await request(app)
        .post(`/api/spreadsheets/${spreadsheetId}/notification-rules`)
        .set(authHeader)
        .send({ triggerType: "any_changes" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.triggerType).toBe("any_changes");
    });

    it("creates a rule with specific_user_changes and email", async () => {
      const created = {
        id: "rule-new",
        userId: "user-1",
        spreadsheetId,
        triggerType: "specific_user_changes",
        triggerEmail: "bob@example.com",
        frequency: "daily_digest",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.notificationRule.create.mockResolvedValue(created);

      const res = await request(app)
        .post(`/api/spreadsheets/${spreadsheetId}/notification-rules`)
        .set(authHeader)
        .send({
          triggerType: "specific_user_changes",
          triggerEmail: "bob@example.com",
          frequency: "daily_digest",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.triggerType).toBe("specific_user_changes");
      expect(res.body.data.triggerEmail).toBe("bob@example.com");
    });

    it("rejects invalid trigger type", async () => {
      const res = await request(app)
        .post(`/api/spreadsheets/${spreadsheetId}/notification-rules`)
        .set(authHeader)
        .send({ triggerType: "invalid_type" });

      expect(res.status).toBe(422);
    });
  });

  describe("PUT /api/spreadsheets/:spreadsheetId/notification-rules/:ruleId", () => {
    it("updates a notification rule", async () => {
      const existing = {
        id: "rule-1",
        userId: "user-1",
        spreadsheetId,
        triggerType: "any_changes",
        triggerEmail: null,
        frequency: "immediately",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.notificationRule.findUnique.mockResolvedValue(existing);
      mockPrisma.notificationRule.update.mockResolvedValue({
        ...existing,
        frequency: "daily_digest",
      });

      const res = await request(app)
        .put(`/api/spreadsheets/${spreadsheetId}/notification-rules/rule-1`)
        .set(authHeader)
        .send({ frequency: "daily_digest" });

      expect(res.status).toBe(200);
      expect(res.body.data.frequency).toBe("daily_digest");
    });

    it("returns 404 for non-existent rule", async () => {
      mockPrisma.notificationRule.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put(
          `/api/spreadsheets/${spreadsheetId}/notification-rules/nonexistent`,
        )
        .set(authHeader)
        .send({ frequency: "daily_digest" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/spreadsheets/:spreadsheetId/notification-rules/:ruleId", () => {
    it("deletes a notification rule", async () => {
      mockPrisma.notificationRule.findUnique.mockResolvedValue({
        id: "rule-1",
        userId: "user-1",
      });
      mockPrisma.notificationRule.delete.mockResolvedValue({});

      const res = await request(app)
        .delete(`/api/spreadsheets/${spreadsheetId}/notification-rules/rule-1`)
        .set(authHeader);

      expect(res.status).toBe(204);
    });

    it("returns 404 when deleting non-existent rule", async () => {
      mockPrisma.notificationRule.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete(
          `/api/spreadsheets/${spreadsheetId}/notification-rules/nonexistent`,
        )
        .set(authHeader);

      expect(res.status).toBe(404);
    });
  });
});
