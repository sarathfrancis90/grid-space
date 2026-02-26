import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    user: { findUnique: vi.fn() },
    spreadsheet: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    sheet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    webhook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock auth service for JWT token verification
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

// Mock bcryptjs for API key validation
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-key"),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue("hashed-key"),
  compare: vi.fn().mockResolvedValue(true),
}));

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
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  apiKey: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  webhook: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const apiKeyHeader = {
  "X-API-Key": "gs_test1234567890abcdef1234567890abcdef1234567890abcdef",
};
const authHeader = { Authorization: "Bearer valid-test-token" };

describe("Public API (S16-001 to S16-005)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user lookup for both auth methods
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });

    // Mock API key validation
    mockPrisma.apiKey.findMany.mockResolvedValue([
      {
        id: "key-1",
        userId: "user-1",
        keyHash: "hashed-key",
        expiresAt: null,
      },
    ]);
    mockPrisma.apiKey.update.mockResolvedValue({});
  });

  describe("GET /api/v1/spreadsheets/:id (S16-001)", () => {
    it("returns spreadsheet with API key auth", async () => {
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({ ownerId: "user-1", access: [] })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "Test Sheet",
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
        .get("/api/v1/spreadsheets/ss-1")
        .set(apiKeyHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("ss-1");
    });

    it("returns 401 without API key", async () => {
      const res = await request(app).get("/api/v1/spreadsheets/ss-1");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/spreadsheets/:id/sheets (S16-002)", () => {
    it("returns sheets list", async () => {
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({ ownerId: "user-1", access: [] })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "Test",
          isStarred: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: "user-1",
            name: "Test",
            email: "t@e.com",
            avatarUrl: null,
          },
          sheets: [],
        });

      mockPrisma.sheet.findMany.mockResolvedValue([
        { id: "sh-1", name: "Sheet 1", index: 0, color: null, isHidden: false },
      ]);

      const res = await request(app)
        .get("/api/v1/spreadsheets/ss-1/sheets")
        .set(apiKeyHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/v1/spreadsheets/:id/sheets/:sheetId/cells (S16-003)", () => {
    it("returns cell data", async () => {
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({ ownerId: "user-1", access: [] })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "Test",
          isStarred: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: "user-1",
            name: "Test",
            email: "t@e.com",
            avatarUrl: null,
          },
          sheets: [],
        });

      mockPrisma.sheet.findFirst.mockResolvedValue({
        cellData: { A1: { value: "hello" }, B2: { value: 42 } },
      });

      const res = await request(app)
        .get("/api/v1/spreadsheets/ss-1/sheets/sh-1/cells")
        .set(apiKeyHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cells.A1).toEqual({ value: "hello" });
    });

    it("supports range filter", async () => {
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({ ownerId: "user-1", access: [] })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "Test",
          isStarred: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: "user-1",
            name: "Test",
            email: "t@e.com",
            avatarUrl: null,
          },
          sheets: [],
        });

      mockPrisma.sheet.findFirst.mockResolvedValue({
        cellData: {
          A1: { value: "hello" },
          B2: { value: 42 },
          C5: { value: "outside" },
        },
      });

      const res = await request(app)
        .get("/api/v1/spreadsheets/ss-1/sheets/sh-1/cells?range=A1:B2")
        .set(apiKeyHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.cells.A1).toBeDefined();
      expect(res.body.data.cells.B2).toBeDefined();
      expect(res.body.data.cells.C5).toBeUndefined();
    });
  });

  describe("PUT /api/v1/spreadsheets/:id/sheets/:sheetId/cells (S16-004)", () => {
    it("batch updates cells", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.sheet.findFirst.mockResolvedValue({
        cellData: { A1: { value: "old" } },
      });

      mockPrisma.sheet.update.mockResolvedValue({});
      mockPrisma.spreadsheet.update.mockResolvedValue({});
      mockPrisma.webhook.findMany.mockResolvedValue([]);

      const res = await request(app)
        .put("/api/v1/spreadsheets/ss-1/sheets/sh-1/cells")
        .set(apiKeyHeader)
        .send({
          cells: [
            { cell: "A1", value: "new" },
            { cell: "B1", value: 100 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCells).toBe(2);
    });

    it("validates request body", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      const res = await request(app)
        .put("/api/v1/spreadsheets/ss-1/sheets/sh-1/cells")
        .set(apiKeyHeader)
        .send({ cells: "not-an-array" });

      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/v1/spreadsheets/:id/export/:format (S16-005)", () => {
    it("exports as CSV", async () => {
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({ ownerId: "user-1", access: [] })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "Test Export",
          isStarred: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: "user-1",
            name: "Test",
            email: "t@e.com",
            avatarUrl: null,
          },
          sheets: [
            {
              id: "sh-1",
              name: "Sheet 1",
              index: 0,
              color: null,
              isHidden: false,
              cellData: {
                A1: { value: "Name" },
                B1: { value: "Age" },
                A2: { value: "Alice" },
                B2: { value: 30 },
              },
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
        .get("/api/v1/spreadsheets/ss-1/export/csv")
        .set(apiKeyHeader);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Name");
    });

    it("rejects invalid format", async () => {
      mockPrisma.spreadsheet.findUnique
        .mockResolvedValueOnce({ ownerId: "user-1", access: [] })
        .mockResolvedValueOnce({
          id: "ss-1",
          title: "Test",
          isStarred: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: "user-1",
            name: "Test",
            email: "t@e.com",
            avatarUrl: null,
          },
          sheets: [],
        });

      const res = await request(app)
        .get("/api/v1/spreadsheets/ss-1/export/invalid")
        .set(apiKeyHeader);

      expect(res.status).toBe(400);
    });
  });
});

describe("API Key Management (S16-006 to S16-008)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("GET /api/users/me/api-keys (S16-006)", () => {
    it("lists API keys", async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([
        {
          id: "key-1",
          name: "My Key",
          prefix: "gs_abc12345",
          lastUsedAt: null,
          expiresAt: null,
          rateLimit: 60,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .get("/api/users/me/api-keys")
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("My Key");
    });
  });

  describe("POST /api/users/me/api-keys (S16-006)", () => {
    it("creates API key and returns raw key", async () => {
      mockPrisma.apiKey.create.mockResolvedValue({
        id: "key-new",
        name: "New Key",
        prefix: "gs_abcdef12",
        lastUsedAt: null,
        expiresAt: null,
        rateLimit: 60,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post("/api/users/me/api-keys")
        .set(authHeader)
        .send({ name: "New Key" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toBeDefined();
      expect(res.body.data.key).toMatch(/^gs_/);
      expect(res.body.data.apiKey.name).toBe("New Key");
    });

    it("validates name is required", async () => {
      const res = await request(app)
        .post("/api/users/me/api-keys")
        .set(authHeader)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe("DELETE /api/users/me/api-keys/:keyId (S16-006)", () => {
    it("revokes an API key", async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.apiKey.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/users/me/api-keys/key-1")
        .set(authHeader);

      expect(res.status).toBe(204);
    });
  });

  describe("API Documentation (S16-008)", () => {
    it("serves API documentation", async () => {
      const res = await request(app).get("/api/docs");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.endpoints.length).toBeGreaterThan(0);
    });

    it("serves OpenAPI spec", async () => {
      const res = await request(app).get("/api/docs/openapi");
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe("3.0.3");
      expect(res.body.info.title).toContain("GridSpace");
      expect(res.body.paths).toBeDefined();
    });
  });
});

describe("Webhook Management (S16-009)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  describe("POST /api/webhooks", () => {
    it("creates a webhook", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "user-1",
        access: [],
      });

      mockPrisma.webhook.create.mockResolvedValue({
        id: "wh-1",
        spreadsheetId: "ss-1",
        url: "https://example.com/webhook",
        events: ["cell.updated"],
        isActive: true,
        lastTriggeredAt: null,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post("/api/webhooks")
        .set(authHeader)
        .send({
          spreadsheetId: "ss-1",
          url: "https://example.com/webhook",
          events: ["cell.updated"],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("wh-1");
      expect(res.body.data.secret).toBeDefined();
    });

    it("validates events", async () => {
      const res = await request(app)
        .post("/api/webhooks")
        .set(authHeader)
        .send({
          spreadsheetId: "ss-1",
          url: "https://example.com/webhook",
          events: ["invalid.event"],
        });

      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/webhooks", () => {
    it("lists webhooks", async () => {
      mockPrisma.webhook.findMany.mockResolvedValue([
        {
          id: "wh-1",
          spreadsheetId: "ss-1",
          url: "https://example.com/webhook",
          events: ["cell.updated"],
          isActive: true,
          lastTriggeredAt: null,
          createdAt: new Date(),
        },
      ]);

      const res = await request(app).get("/api/webhooks").set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("DELETE /api/webhooks/:webhookId", () => {
    it("deletes a webhook", async () => {
      mockPrisma.webhook.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.webhook.delete.mockResolvedValue({});

      const res = await request(app)
        .delete("/api/webhooks/wh-1")
        .set(authHeader);

      expect(res.status).toBe(204);
    });
  });
});
