import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    dataConnector: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    dataConnectorCredential: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    spreadsheet: {
      findUnique: vi.fn(),
    },
    spreadsheetAccess: {
      findUnique: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

vi.mock("../utils/logger", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import prisma from "../models/prisma";
import * as connectorService from "../services/connector.service";

const mockPrisma = prisma as unknown as {
  dataConnector: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  dataConnectorCredential: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  spreadsheet: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  spreadsheetAccess: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

// ─── Helpers ────────────────────────────────────────────

function mockSpreadsheetOwner(userId: string) {
  mockPrisma.spreadsheet.findUnique.mockResolvedValue({
    ownerId: userId,
  });
}

function makeBigQueryConfig() {
  return {
    projectId: "my-project",
    datasetId: "my_dataset",
    tableId: "my_table",
    maxRows: 100,
  };
}

// ─── Encryption tests ───────────────────────────────────

describe("credential encryption", () => {
  it("encrypts and decrypts a credential config round-trip", () => {
    const original = JSON.stringify({ serviceAccountKey: "secret-123" });
    const encrypted = connectorService.encryptCredentialConfig(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = connectorService.decryptCredentialConfig(encrypted);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext each time (random IV)", () => {
    const original = "same-plaintext";
    const a = connectorService.encryptCredentialConfig(original);
    const b = connectorService.encryptCredentialConfig(original);
    expect(a).not.toBe(b);
  });
});

// ─── Credential CRUD ────────────────────────────────────

describe("credential service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCredential", () => {
    it("creates a credential with encrypted config", async () => {
      const credRecord = {
        id: "cred-1",
        name: "My BQ Cred",
        type: "bigquery",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.dataConnectorCredential.create.mockResolvedValue(credRecord);

      const result = await connectorService.createCredential(
        "user-1",
        "My BQ Cred",
        "bigquery",
        JSON.stringify({ key: "value" }),
      );

      expect(result.id).toBe("cred-1");
      expect(mockPrisma.dataConnectorCredential.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            name: "My BQ Cred",
            type: "bigquery",
          }),
        }),
      );

      // Verify encryptedConfig is set (not the raw JSON)
      const callArgs =
        mockPrisma.dataConnectorCredential.create.mock.calls[0][0];
      expect(callArgs.data.encryptedConfig).toBeDefined();
      expect(callArgs.data.encryptedConfig).not.toBe('{"key":"value"}');
    });

    it("rejects unsupported connector type", async () => {
      await expect(
        connectorService.createCredential(
          "user-1",
          "Bad",
          "unsupported_db",
          "{}",
        ),
      ).rejects.toThrow("Unsupported connector type");
    });

    it("rejects invalid JSON config", async () => {
      await expect(
        connectorService.createCredential(
          "user-1",
          "Bad",
          "bigquery",
          "not-json",
        ),
      ).rejects.toThrow("valid JSON");
    });
  });

  describe("listCredentials", () => {
    it("returns credentials for a user", async () => {
      const creds = [
        {
          id: "cred-1",
          name: "BQ Cred",
          type: "bigquery",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.dataConnectorCredential.findMany.mockResolvedValue(creds);

      const result = await connectorService.listCredentials("user-1");
      expect(result).toEqual(creds);
    });
  });

  describe("deleteCredential", () => {
    it("deletes credential for the correct user", async () => {
      mockPrisma.dataConnectorCredential.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.dataConnectorCredential.delete.mockResolvedValue({});

      await connectorService.deleteCredential("user-1", "cred-1");
      expect(mockPrisma.dataConnectorCredential.delete).toHaveBeenCalledWith({
        where: { id: "cred-1" },
      });
    });

    it("throws NotFoundError for missing credential", async () => {
      mockPrisma.dataConnectorCredential.findUnique.mockResolvedValue(null);

      await expect(
        connectorService.deleteCredential("user-1", "missing"),
      ).rejects.toThrow("Credential not found");
    });

    it("throws ForbiddenError for wrong user", async () => {
      mockPrisma.dataConnectorCredential.findUnique.mockResolvedValue({
        userId: "other-user",
      });

      await expect(
        connectorService.deleteCredential("user-1", "cred-1"),
      ).rejects.toThrow("Access denied");
    });
  });
});

// ─── Connector CRUD ─────────────────────────────────────

describe("connector service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createConnector", () => {
    it("creates a connector for spreadsheet owner", async () => {
      mockSpreadsheetOwner("user-1");

      const connectorRecord = {
        id: "conn-1",
        name: "BQ Connector",
        type: "bigquery",
        status: "active",
        config: makeBigQueryConfig(),
        credentialId: null,
        sheetId: null,
        refreshSchedule: null,
        lastRefreshAt: null,
        nextRefreshAt: null,
        lastError: null,
        dailyQueryCount: 0,
        dailyQueryLimit: 100,
        dailyBytesScanned: BigInt(0),
        dailyBytesLimit: BigInt(1073741824),
        cacheTtlSeconds: 300,
        cachedAt: null,
        cacheRowCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.dataConnector.create.mockResolvedValue(connectorRecord);

      const result = await connectorService.createConnector(
        "user-1",
        "spreadsheet-1",
        {
          name: "BQ Connector",
          type: "bigquery",
          config: makeBigQueryConfig(),
        },
      );

      expect(result.id).toBe("conn-1");
      expect(result.type).toBe("bigquery");
    });

    it("rejects invalid BigQuery config (missing projectId)", async () => {
      mockSpreadsheetOwner("user-1");

      await expect(
        connectorService.createConnector("user-1", "spreadsheet-1", {
          name: "Bad",
          type: "bigquery",
          config: { datasetId: "ds" },
        }),
      ).rejects.toThrow("BigQuery config requires projectId");
    });

    it("rejects invalid BigQuery config (no tableId or query)", async () => {
      mockSpreadsheetOwner("user-1");

      await expect(
        connectorService.createConnector("user-1", "spreadsheet-1", {
          name: "Bad",
          type: "bigquery",
          config: { projectId: "p", datasetId: "ds" },
        }),
      ).rejects.toThrow("requires either tableId or query");
    });

    it("rejects when spreadsheet not found", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue(null);

      await expect(
        connectorService.createConnector("user-1", "missing-ss", {
          name: "BQ",
          type: "bigquery",
          config: makeBigQueryConfig(),
        }),
      ).rejects.toThrow("Spreadsheet not found");
    });

    it("rejects when user lacks editor access", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
      });
      mockPrisma.spreadsheetAccess.findUnique.mockResolvedValue({
        role: "viewer",
      });

      await expect(
        connectorService.createConnector("user-1", "ss-1", {
          name: "BQ",
          type: "bigquery",
          config: makeBigQueryConfig(),
        }),
      ).rejects.toThrow("Requires editor access");
    });

    it("validates credential type matches connector type", async () => {
      mockSpreadsheetOwner("user-1");
      mockPrisma.dataConnectorCredential.findUnique.mockResolvedValue({
        userId: "user-1",
        type: "postgresql",
      });

      await expect(
        connectorService.createConnector("user-1", "ss-1", {
          name: "BQ",
          type: "bigquery",
          config: makeBigQueryConfig(),
          credentialId: "cred-1",
        }),
      ).rejects.toThrow("does not match connector type");
    });

    it("sets nextRefreshAt for scheduled connectors", async () => {
      mockSpreadsheetOwner("user-1");
      mockPrisma.dataConnector.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          return Promise.resolve({
            id: "conn-1",
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        },
      );

      await connectorService.createConnector("user-1", "ss-1", {
        name: "BQ",
        type: "bigquery",
        config: makeBigQueryConfig(),
        refreshSchedule: "every_1h",
      });

      const createCall = mockPrisma.dataConnector.create.mock.calls[0][0];
      expect(createCall.data.nextRefreshAt).toBeDefined();
      expect(createCall.data.nextRefreshAt).toBeInstanceOf(Date);
      // Should be roughly 1 hour from now
      const diff = createCall.data.nextRefreshAt.getTime() - Date.now();
      expect(diff).toBeGreaterThan(55 * 60 * 1000);
      expect(diff).toBeLessThan(65 * 60 * 1000);
    });

    it("sets nextRefreshAt to null for manual schedule", async () => {
      mockSpreadsheetOwner("user-1");
      mockPrisma.dataConnector.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          return Promise.resolve({
            id: "conn-1",
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        },
      );

      await connectorService.createConnector("user-1", "ss-1", {
        name: "BQ",
        type: "bigquery",
        config: makeBigQueryConfig(),
        refreshSchedule: "manual",
      });

      const createCall = mockPrisma.dataConnector.create.mock.calls[0][0];
      expect(createCall.data.nextRefreshAt).toBeNull();
    });
  });

  describe("listConnectors", () => {
    it("returns connectors for a spreadsheet", async () => {
      mockSpreadsheetOwner("user-1");
      const connectors = [{ id: "conn-1", name: "BQ1", type: "bigquery" }];
      mockPrisma.dataConnector.findMany.mockResolvedValue(connectors);

      const result = await connectorService.listConnectors("user-1", "ss-1");
      expect(result).toEqual(connectors);
    });
  });

  describe("getConnector", () => {
    it("returns connector when user has access", async () => {
      mockPrisma.dataConnector.findUnique.mockResolvedValue({
        id: "conn-1",
        spreadsheetId: "ss-1",
        userId: "user-1",
        name: "BQ Connector",
        type: "bigquery",
      });
      mockSpreadsheetOwner("user-1");

      const result = await connectorService.getConnector("user-1", "conn-1");
      expect(result.id).toBe("conn-1");
    });

    it("throws NotFoundError for missing connector", async () => {
      mockPrisma.dataConnector.findUnique.mockResolvedValue(null);

      await expect(
        connectorService.getConnector("user-1", "missing"),
      ).rejects.toThrow("Connector not found");
    });
  });

  describe("deleteConnector", () => {
    it("deletes connector when user has editor access", async () => {
      mockPrisma.dataConnector.findUnique.mockResolvedValue({
        userId: "user-1",
        spreadsheetId: "ss-1",
      });
      mockSpreadsheetOwner("user-1");
      mockPrisma.dataConnector.delete.mockResolvedValue({});

      await connectorService.deleteConnector("user-1", "conn-1");
      expect(mockPrisma.dataConnector.delete).toHaveBeenCalledWith({
        where: { id: "conn-1" },
      });
    });
  });

  describe("updateConnector", () => {
    it("updates connector name", async () => {
      mockPrisma.dataConnector.findUnique.mockResolvedValue({
        userId: "user-1",
        spreadsheetId: "ss-1",
        type: "bigquery",
      });
      mockSpreadsheetOwner("user-1");
      mockPrisma.dataConnector.update.mockResolvedValue({
        id: "conn-1",
        name: "New Name",
      });

      const result = await connectorService.updateConnector(
        "user-1",
        "conn-1",
        { name: "New Name" },
      );
      expect(result.name).toBe("New Name");
    });

    it("rejects invalid status", async () => {
      mockPrisma.dataConnector.findUnique.mockResolvedValue({
        userId: "user-1",
        spreadsheetId: "ss-1",
        type: "bigquery",
      });
      mockSpreadsheetOwner("user-1");

      await expect(
        connectorService.updateConnector("user-1", "conn-1", {
          status: "bogus",
        }),
      ).rejects.toThrow("Invalid status");
    });
  });
});

// ─── Query execution ────────────────────────────────────

describe("executeConnectorQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached data when cache is fresh", async () => {
    const cachedData = {
      columns: ["id", "name"],
      rows: [{ id: 1, name: "Test" }],
      totalRows: 1,
    };

    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      id: "conn-1",
      userId: "user-1",
      spreadsheetId: "ss-1",
      type: "bigquery",
      status: "active",
      config: makeBigQueryConfig(),
      credentialId: null,
      cachedData,
      cachedAt: new Date(), // just now
      cacheTtlSeconds: 300,
      dailyQueryCount: 0,
      dailyQueryLimit: 100,
      dailyBytesScanned: BigInt(0),
      dailyBytesLimit: BigInt(1073741824),
      refreshSchedule: null,
      cacheRowCount: 1,
    });
    mockSpreadsheetOwner("user-1");

    const result = await connectorService.executeConnectorQuery(
      "user-1",
      "conn-1",
    );

    expect(result.fromCache).toBe(true);
    expect(result.columns).toEqual(["id", "name"]);
    expect(result.rows).toEqual([{ id: 1, name: "Test" }]);
    // Should not have called update (no query executed)
    expect(mockPrisma.dataConnector.update).not.toHaveBeenCalled();
  });

  it("executes query when cache is stale", async () => {
    const staleDate = new Date(Date.now() - 600_000); // 10 min ago

    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      id: "conn-1",
      userId: "user-1",
      spreadsheetId: "ss-1",
      type: "bigquery",
      status: "active",
      config: makeBigQueryConfig(),
      credentialId: null,
      cachedData: null,
      cachedAt: staleDate,
      cacheTtlSeconds: 300,
      dailyQueryCount: 0,
      dailyQueryLimit: 100,
      dailyBytesScanned: BigInt(0),
      dailyBytesLimit: BigInt(1073741824),
      refreshSchedule: null,
      cacheRowCount: 0,
    });
    mockSpreadsheetOwner("user-1");
    mockPrisma.dataConnector.update.mockResolvedValue({});

    const result = await connectorService.executeConnectorQuery(
      "user-1",
      "conn-1",
    );

    expect(result.fromCache).toBe(false);
    expect(mockPrisma.dataConnector.update).toHaveBeenCalled();
  });

  it("forces refresh even when cache is fresh", async () => {
    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      id: "conn-1",
      userId: "user-1",
      spreadsheetId: "ss-1",
      type: "bigquery",
      status: "active",
      config: makeBigQueryConfig(),
      credentialId: null,
      cachedData: { columns: [], rows: [], totalRows: 0 },
      cachedAt: new Date(),
      cacheTtlSeconds: 300,
      dailyQueryCount: 0,
      dailyQueryLimit: 100,
      dailyBytesScanned: BigInt(0),
      dailyBytesLimit: BigInt(1073741824),
      refreshSchedule: null,
      cacheRowCount: 0,
    });
    mockSpreadsheetOwner("user-1");
    mockPrisma.dataConnector.update.mockResolvedValue({});

    const result = await connectorService.executeConnectorQuery(
      "user-1",
      "conn-1",
      true,
    );

    expect(result.fromCache).toBe(false);
  });

  it("throws when connector is paused", async () => {
    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      id: "conn-1",
      userId: "user-1",
      spreadsheetId: "ss-1",
      status: "paused",
    });
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.executeConnectorQuery("user-1", "conn-1"),
    ).rejects.toThrow("Connector is paused");
  });

  it("throws when daily query limit is reached", async () => {
    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      id: "conn-1",
      userId: "user-1",
      spreadsheetId: "ss-1",
      type: "bigquery",
      status: "active",
      config: makeBigQueryConfig(),
      credentialId: null,
      cachedData: null,
      cachedAt: null,
      cacheTtlSeconds: 300,
      dailyQueryCount: 100,
      dailyQueryLimit: 100,
      dailyBytesScanned: BigInt(0),
      dailyBytesLimit: BigInt(1073741824),
      refreshSchedule: null,
      cacheRowCount: 0,
    });
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.executeConnectorQuery("user-1", "conn-1"),
    ).rejects.toThrow("Daily query limit reached");
  });
});

// ─── Cache invalidation ─────────────────────────────────

describe("invalidateCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears cached data", async () => {
    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      spreadsheetId: "ss-1",
    });
    mockSpreadsheetOwner("user-1");
    mockPrisma.dataConnector.update.mockResolvedValue({});

    await connectorService.invalidateCache("user-1", "conn-1");

    expect(mockPrisma.dataConnector.update).toHaveBeenCalledWith({
      where: { id: "conn-1" },
      data: { cachedData: null, cachedAt: null, cacheRowCount: 0 },
    });
  });
});

// ─── Daily quota reset ──────────────────────────────────

describe("resetDailyQuotas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets quotas for all connectors", async () => {
    mockPrisma.dataConnector.updateMany.mockResolvedValue({ count: 5 });

    const count = await connectorService.resetDailyQuotas();
    expect(count).toBe(5);
    expect(mockPrisma.dataConnector.updateMany).toHaveBeenCalledWith({
      where: { dailyQueryCount: { gt: 0 } },
      data: { dailyQueryCount: 0, dailyBytesScanned: BigInt(0) },
    });
  });
});

// ─── Connector stats ────────────────────────────────────

describe("getConnectorStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns observability stats", async () => {
    mockPrisma.dataConnector.findUnique.mockResolvedValue({
      spreadsheetId: "ss-1",
      dailyQueryCount: 5,
      dailyQueryLimit: 100,
      dailyBytesScanned: BigInt(500000),
      dailyBytesLimit: BigInt(1073741824),
      cacheRowCount: 42,
      cacheTtlSeconds: 300,
      cachedAt: new Date(),
      lastRefreshAt: new Date(),
      nextRefreshAt: new Date(),
      lastError: null,
      status: "active",
    });
    mockSpreadsheetOwner("user-1");

    const stats = await connectorService.getConnectorStats("user-1", "conn-1");

    expect(stats.dailyQueryCount).toBe(5);
    expect(stats.dailyBytesScanned).toBe("500000");
    expect(stats.status).toBe("active");
  });
});

// ─── Due refresh check ──────────────────────────────────

describe("getConnectorsDueForRefresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns connectors that need refresh", async () => {
    const due = [
      {
        id: "conn-1",
        userId: "user-1",
        spreadsheetId: "ss-1",
        type: "bigquery",
      },
    ];
    mockPrisma.dataConnector.findMany.mockResolvedValue(due);

    const result = await connectorService.getConnectorsDueForRefresh();
    expect(result).toEqual(due);
    expect(mockPrisma.dataConnector.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "active",
          nextRefreshAt: { lte: expect.any(Date) },
        }),
      }),
    );
  });
});

// ─── Config validation for other connector types ────────

describe("connector type validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates PostgreSQL config", async () => {
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.createConnector("user-1", "ss-1", {
        name: "PG",
        type: "postgresql",
        config: { host: "localhost", database: "mydb", query: "SELECT 1" },
      }),
    ).resolves.toBeDefined();
  });

  it("rejects PostgreSQL config without host", async () => {
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.createConnector("user-1", "ss-1", {
        name: "PG",
        type: "postgresql",
        config: { database: "mydb", query: "SELECT 1" },
      }),
    ).rejects.toThrow("PostgreSQL config requires host");
  });

  it("validates MySQL config", async () => {
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.createConnector("user-1", "ss-1", {
        name: "MySQL",
        type: "mysql",
        config: { host: "localhost", database: "mydb", query: "SELECT 1" },
      }),
    ).resolves.toBeDefined();
  });

  it("validates CSV URL config", async () => {
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.createConnector("user-1", "ss-1", {
        name: "CSV",
        type: "csv_url",
        config: { url: "https://example.com/data.csv" },
      }),
    ).resolves.toBeDefined();
  });

  it("rejects CSV URL config without url", async () => {
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.createConnector("user-1", "ss-1", {
        name: "CSV",
        type: "csv_url",
        config: {},
      }),
    ).rejects.toThrow("CSV URL config requires url");
  });

  it("rejects unsupported connector type", async () => {
    mockSpreadsheetOwner("user-1");

    await expect(
      connectorService.createConnector("user-1", "ss-1", {
        name: "Bad",
        type: "oracle",
        config: {},
      }),
    ).rejects.toThrow("Unsupported connector type");
  });
});
