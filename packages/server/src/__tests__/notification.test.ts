import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
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
  notification: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  notificationPreference: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Notification Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("GET /api/notifications", () => {
    it("returns paginated notifications", async () => {
      mockPrisma.notification.findMany.mockResolvedValue([
        {
          id: "n-1",
          userId: "user-1",
          type: "share",
          title: "New share",
          message: "Alice shared a spreadsheet",
          read: false,
          spreadsheetId: null,
          cellRef: null,
          fromUserId: null,
          fromUserName: null,
          fromUserEmail: null,
          createdAt: new Date(),
        },
      ]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const res = await request(app).get("/api/notifications").set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("returns unread count", async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const res = await request(app)
        .get("/api/notifications/unread-count")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(5);
    });
  });

  describe("PUT /api/notifications/:id/read", () => {
    it("marks notification as read", async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: "n-1",
        userId: "user-1",
        read: false,
      });

      mockPrisma.notification.update.mockResolvedValue({
        id: "n-1",
        userId: "user-1",
        type: "share",
        title: "Test",
        message: "Test",
        read: true,
        createdAt: new Date(),
      });

      const res = await request(app)
        .put("/api/notifications/n-1/read")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.read).toBe(true);
    });
  });

  describe("PUT /api/notifications/read-all", () => {
    it("marks all as read", async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const res = await request(app)
        .put("/api/notifications/read-all")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("deletes a notification", async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: "n-1",
        userId: "user-1",
      });

      mockPrisma.notification.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/notifications/n-1")
        .set(authHeader);

      expect(res.status).toBe(204);
    });
  });

  describe("GET /api/notifications/preferences", () => {
    it("returns default preferences when none set", async () => {
      mockPrisma.notificationPreference.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/notifications/preferences")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.inAppSharing).toBe(true);
      expect(res.body.data.emailSharing).toBe(false);
    });
  });

  describe("PUT /api/notifications/preferences", () => {
    it("updates preferences", async () => {
      mockPrisma.notificationPreference.upsert.mockResolvedValue({
        emailSharing: true,
        emailComments: false,
        emailMentions: true,
        inAppSharing: true,
        inAppComments: true,
        inAppMentions: true,
      });

      const res = await request(app)
        .put("/api/notifications/preferences")
        .set(authHeader)
        .send({ emailSharing: true, emailMentions: true });

      expect(res.status).toBe(200);
      expect(res.body.data.emailSharing).toBe(true);
    });
  });
});
