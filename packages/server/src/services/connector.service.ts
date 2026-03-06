import crypto from "crypto";
import prisma from "../models/prisma";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  AppError,
} from "../utils/AppError";
import logger from "../utils/logger";

// ─── Types ──────────────────────────────────────────────

const SUPPORTED_CONNECTOR_TYPES = [
  "bigquery",
  "postgresql",
  "mysql",
  "csv_url",
] as const;

type ConnectorType = (typeof SUPPORTED_CONNECTOR_TYPES)[number];

interface ConnectorRow {
  [column: string]: string | number | boolean | null;
}

interface ConnectorQueryResult {
  columns: string[];
  rows: ConnectorRow[];
  totalRows: number;
  bytesProcessed: bigint;
  truncated: boolean;
}

interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  tableId?: string;
  query?: string;
  maxRows?: number;
}

interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  query: string;
  maxRows?: number;
}

interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  query: string;
  maxRows?: number;
}

interface CsvUrlConfig {
  url: string;
  maxRows?: number;
}

type ConnectorConfig =
  | BigQueryConfig
  | PostgreSQLConfig
  | MySQLConfig
  | CsvUrlConfig;

interface ConnectorRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  config: unknown;
  credentialId: string | null;
  sheetId: string | null;
  refreshSchedule: string | null;
  lastRefreshAt: Date | null;
  nextRefreshAt: Date | null;
  lastError: string | null;
  dailyQueryCount: number;
  dailyQueryLimit: number;
  dailyBytesScanned: bigint;
  dailyBytesLimit: bigint;
  cacheTtlSeconds: number;
  cachedAt: Date | null;
  cacheRowCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CredentialRecord {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Encryption helpers ─────────────────────────────────

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key =
    process.env.CONNECTOR_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? "";
  return crypto.scryptSync(key, "gridspace-connector-salt", 32);
}

export function encryptCredentialConfig(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptCredentialConfig(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new AppError(500, "Corrupted credential data");
  }
  const iv = Buffer.from(parts[0], "base64");
  const tag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ─── Connector abstraction ──────────────────────────────

interface DataSourceDriver {
  validateConfig(config: unknown): ConnectorConfig;
  executeQuery(
    config: ConnectorConfig,
    credentialJson: string | null,
  ): Promise<ConnectorQueryResult>;
}

function validateBigQueryConfig(config: unknown): BigQueryConfig {
  const c = config as Record<string, unknown>;
  if (typeof c.projectId !== "string" || c.projectId.length === 0) {
    throw new ValidationError("BigQuery config requires projectId");
  }
  if (typeof c.datasetId !== "string" || c.datasetId.length === 0) {
    throw new ValidationError("BigQuery config requires datasetId");
  }
  if (c.tableId !== undefined && typeof c.tableId !== "string") {
    throw new ValidationError("BigQuery config tableId must be a string");
  }
  if (c.query !== undefined && typeof c.query !== "string") {
    throw new ValidationError("BigQuery config query must be a string");
  }
  if (!c.tableId && !c.query) {
    throw new ValidationError(
      "BigQuery config requires either tableId or query",
    );
  }
  const maxRows = typeof c.maxRows === "number" ? c.maxRows : 10000;
  return {
    projectId: c.projectId,
    datasetId: c.datasetId,
    tableId: c.tableId as string | undefined,
    query: c.query as string | undefined,
    maxRows,
  };
}

function validatePostgreSQLConfig(config: unknown): PostgreSQLConfig {
  const c = config as Record<string, unknown>;
  if (typeof c.host !== "string" || c.host.length === 0) {
    throw new ValidationError("PostgreSQL config requires host");
  }
  if (typeof c.database !== "string" || c.database.length === 0) {
    throw new ValidationError("PostgreSQL config requires database");
  }
  if (typeof c.query !== "string" || c.query.length === 0) {
    throw new ValidationError("PostgreSQL config requires query");
  }
  return {
    host: c.host,
    port: typeof c.port === "number" ? c.port : 5432,
    database: c.database,
    query: c.query,
    maxRows: typeof c.maxRows === "number" ? c.maxRows : 10000,
  };
}

function validateMySQLConfig(config: unknown): MySQLConfig {
  const c = config as Record<string, unknown>;
  if (typeof c.host !== "string" || c.host.length === 0) {
    throw new ValidationError("MySQL config requires host");
  }
  if (typeof c.database !== "string" || c.database.length === 0) {
    throw new ValidationError("MySQL config requires database");
  }
  if (typeof c.query !== "string" || c.query.length === 0) {
    throw new ValidationError("MySQL config requires query");
  }
  return {
    host: c.host,
    port: typeof c.port === "number" ? c.port : 3306,
    database: c.database,
    query: c.query,
    maxRows: typeof c.maxRows === "number" ? c.maxRows : 10000,
  };
}

function validateCsvUrlConfig(config: unknown): CsvUrlConfig {
  const c = config as Record<string, unknown>;
  if (typeof c.url !== "string" || c.url.length === 0) {
    throw new ValidationError("CSV URL config requires url");
  }
  return {
    url: c.url,
    maxRows: typeof c.maxRows === "number" ? c.maxRows : 10000,
  };
}

/**
 * BigQuery driver — in production this would use the @google-cloud/bigquery SDK.
 * For now the execute path returns a structured placeholder so the API layer
 * is fully wired and testable. The actual SDK call is isolated here for
 * easy replacement.
 */
const bigqueryDriver: DataSourceDriver = {
  validateConfig: validateBigQueryConfig,
  async executeQuery(config, _credentialJson) {
    const bqConfig = config as BigQueryConfig;
    const queryStr =
      bqConfig.query ??
      `SELECT * FROM \`${bqConfig.projectId}.${bqConfig.datasetId}.${bqConfig.tableId}\` LIMIT ${bqConfig.maxRows ?? 10000}`;

    logger.info(
      { projectId: bqConfig.projectId, dataset: bqConfig.datasetId },
      "BigQuery query dispatched",
    );

    // Placeholder — real implementation calls BigQuery REST/SDK
    return {
      columns: ["_placeholder"],
      rows: [],
      totalRows: 0,
      bytesProcessed: BigInt(0),
      truncated: false,
    } satisfies ConnectorQueryResult;
  },
};

const postgresqlDriver: DataSourceDriver = {
  validateConfig: validatePostgreSQLConfig,
  async executeQuery(_config, _credentialJson) {
    return {
      columns: ["_placeholder"],
      rows: [],
      totalRows: 0,
      bytesProcessed: BigInt(0),
      truncated: false,
    };
  },
};

const mysqlDriver: DataSourceDriver = {
  validateConfig: validateMySQLConfig,
  async executeQuery(_config, _credentialJson) {
    return {
      columns: ["_placeholder"],
      rows: [],
      totalRows: 0,
      bytesProcessed: BigInt(0),
      truncated: false,
    };
  },
};

const csvUrlDriver: DataSourceDriver = {
  validateConfig: validateCsvUrlConfig,
  async executeQuery(_config, _credentialJson) {
    return {
      columns: ["_placeholder"],
      rows: [],
      totalRows: 0,
      bytesProcessed: BigInt(0),
      truncated: false,
    };
  },
};

const DRIVERS: Record<ConnectorType, DataSourceDriver> = {
  bigquery: bigqueryDriver,
  postgresql: postgresqlDriver,
  mysql: mysqlDriver,
  csv_url: csvUrlDriver,
};

function getDriver(type: string): DataSourceDriver {
  if (!SUPPORTED_CONNECTOR_TYPES.includes(type as ConnectorType)) {
    throw new ValidationError(
      `Unsupported connector type: ${type}. Supported: ${SUPPORTED_CONNECTOR_TYPES.join(", ")}`,
    );
  }
  return DRIVERS[type as ConnectorType];
}

// ─── Prisma select fields ───────────────────────────────

const CONNECTOR_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  config: true,
  credentialId: true,
  sheetId: true,
  refreshSchedule: true,
  lastRefreshAt: true,
  nextRefreshAt: true,
  lastError: true,
  dailyQueryCount: true,
  dailyQueryLimit: true,
  dailyBytesScanned: true,
  dailyBytesLimit: true,
  cacheTtlSeconds: true,
  cachedAt: true,
  cacheRowCount: true,
  createdAt: true,
  updatedAt: true,
};

const CREDENTIAL_SELECT = {
  id: true,
  name: true,
  type: true,
  createdAt: true,
  updatedAt: true,
};

// ─── Permission check helper ────────────────────────────

async function assertSpreadsheetAccess(
  userId: string,
  spreadsheetId: string,
  requiredRole: "viewer" | "editor" | "owner",
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: { ownerId: true },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  if (spreadsheet.ownerId === userId) return; // owner has full access

  if (requiredRole === "owner") {
    throw new ForbiddenError(
      "Only the spreadsheet owner can perform this action",
    );
  }

  const access = await prisma.spreadsheetAccess.findUnique({
    where: {
      spreadsheetId_userId: { spreadsheetId, userId },
    },
    select: { role: true },
  });

  if (!access) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }

  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    editor: 2,
    owner: 3,
  };

  if ((roleHierarchy[access.role] ?? 0) < (roleHierarchy[requiredRole] ?? 0)) {
    throw new ForbiddenError(
      `Requires ${requiredRole} access, you have ${access.role}`,
    );
  }
}

// ─── Schedule helpers ───────────────────────────────────

function computeNextRefresh(schedule: string | null): Date | null {
  if (!schedule || schedule === "manual") return null;

  const intervalMap: Record<string, number> = {
    every_5m: 5 * 60 * 1000,
    every_15m: 15 * 60 * 1000,
    every_30m: 30 * 60 * 1000,
    every_1h: 60 * 60 * 1000,
    every_4h: 4 * 60 * 60 * 1000,
    every_12h: 12 * 60 * 60 * 1000,
    every_24h: 24 * 60 * 60 * 1000,
  };

  const interval = intervalMap[schedule];
  if (!interval) return null;

  return new Date(Date.now() + interval);
}

// ─── Quota enforcement ──────────────────────────────────

function assertQuota(connector: {
  dailyQueryCount: number;
  dailyQueryLimit: number;
  dailyBytesScanned: bigint;
  dailyBytesLimit: bigint;
}): void {
  if (connector.dailyQueryCount >= connector.dailyQueryLimit) {
    throw new AppError(
      429,
      `Daily query limit reached (${connector.dailyQueryLimit}). Resets at midnight UTC.`,
    );
  }
  if (connector.dailyBytesScanned >= connector.dailyBytesLimit) {
    throw new AppError(
      429,
      "Daily bytes scanned limit reached. Resets at midnight UTC.",
    );
  }
}

// ─── Credential CRUD ────────────────────────────────────

export async function createCredential(
  userId: string,
  name: string,
  type: string,
  configJson: string,
): Promise<CredentialRecord> {
  // Validate type
  getDriver(type);

  // Validate the config JSON is parseable
  try {
    JSON.parse(configJson);
  } catch {
    throw new ValidationError("Credential config must be valid JSON");
  }

  const encrypted = encryptCredentialConfig(configJson);

  const cred = await prisma.dataConnectorCredential.create({
    data: {
      userId,
      name,
      type,
      encryptedConfig: encrypted,
    },
    select: CREDENTIAL_SELECT,
  });

  logger.info({ userId, credentialId: cred.id, type }, "Credential created");
  return cred;
}

export async function listCredentials(
  userId: string,
): Promise<CredentialRecord[]> {
  return prisma.dataConnectorCredential.findMany({
    where: { userId },
    select: CREDENTIAL_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteCredential(
  userId: string,
  credentialId: string,
): Promise<void> {
  const cred = await prisma.dataConnectorCredential.findUnique({
    where: { id: credentialId },
    select: { userId: true },
  });

  if (!cred) throw new NotFoundError("Credential not found");
  if (cred.userId !== userId) throw new ForbiddenError("Access denied");

  await prisma.dataConnectorCredential.delete({
    where: { id: credentialId },
  });

  logger.info({ userId, credentialId }, "Credential deleted");
}

// ─── Connector CRUD ─────────────────────────────────────

export async function createConnector(
  userId: string,
  spreadsheetId: string,
  data: {
    name: string;
    type: string;
    config: unknown;
    credentialId?: string;
    sheetId?: string;
    refreshSchedule?: string;
    cacheTtlSeconds?: number;
    dailyQueryLimit?: number;
    dailyBytesLimit?: string; // string because BigInt
  },
): Promise<ConnectorRecord> {
  await assertSpreadsheetAccess(userId, spreadsheetId, "editor");

  const driver = getDriver(data.type);
  driver.validateConfig(data.config);

  // Verify credential ownership if provided
  if (data.credentialId) {
    const cred = await prisma.dataConnectorCredential.findUnique({
      where: { id: data.credentialId },
      select: { userId: true, type: true },
    });
    if (!cred) throw new NotFoundError("Credential not found");
    if (cred.userId !== userId)
      throw new ForbiddenError("Access denied to credential");
    if (cred.type !== data.type) {
      throw new ValidationError(
        `Credential type "${cred.type}" does not match connector type "${data.type}"`,
      );
    }
  }

  const nextRefresh = computeNextRefresh(data.refreshSchedule ?? null);

  const connector = await prisma.dataConnector.create({
    data: {
      userId,
      spreadsheetId,
      name: data.name,
      type: data.type,
      config: data.config as object,
      credentialId: data.credentialId ?? null,
      sheetId: data.sheetId ?? null,
      refreshSchedule: data.refreshSchedule ?? null,
      nextRefreshAt: nextRefresh,
      cacheTtlSeconds: data.cacheTtlSeconds ?? 300,
      dailyQueryLimit: data.dailyQueryLimit ?? 100,
      dailyBytesLimit: data.dailyBytesLimit
        ? BigInt(data.dailyBytesLimit)
        : BigInt(1073741824),
    },
    select: CONNECTOR_SELECT,
  });

  logger.info(
    { userId, connectorId: connector.id, type: data.type },
    "Data connector created",
  );

  return connector;
}

export async function listConnectors(
  userId: string,
  spreadsheetId: string,
): Promise<ConnectorRecord[]> {
  await assertSpreadsheetAccess(userId, spreadsheetId, "viewer");

  return prisma.dataConnector.findMany({
    where: { spreadsheetId },
    select: CONNECTOR_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getConnector(
  userId: string,
  connectorId: string,
): Promise<ConnectorRecord> {
  const connector = await prisma.dataConnector.findUnique({
    where: { id: connectorId },
    select: { ...CONNECTOR_SELECT, userId: true, spreadsheetId: true },
  });

  if (!connector) throw new NotFoundError("Connector not found");

  await assertSpreadsheetAccess(userId, connector.spreadsheetId, "viewer");

  return connector;
}

export async function updateConnector(
  userId: string,
  connectorId: string,
  data: {
    name?: string;
    config?: unknown;
    credentialId?: string | null;
    sheetId?: string | null;
    refreshSchedule?: string | null;
    cacheTtlSeconds?: number;
    dailyQueryLimit?: number;
    dailyBytesLimit?: string;
    status?: string;
  },
): Promise<ConnectorRecord> {
  const connector = await prisma.dataConnector.findUnique({
    where: { id: connectorId },
    select: { userId: true, spreadsheetId: true, type: true },
  });

  if (!connector) throw new NotFoundError("Connector not found");
  await assertSpreadsheetAccess(userId, connector.spreadsheetId, "editor");

  if (data.config) {
    const driver = getDriver(connector.type);
    driver.validateConfig(data.config);
  }

  if (data.status) {
    const validStatuses = ["active", "paused", "error"];
    if (!validStatuses.includes(data.status)) {
      throw new ValidationError(`Invalid status: ${data.status}`);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.config !== undefined) updateData.config = data.config as object;
  if (data.credentialId !== undefined)
    updateData.credentialId = data.credentialId;
  if (data.sheetId !== undefined) updateData.sheetId = data.sheetId;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.cacheTtlSeconds !== undefined)
    updateData.cacheTtlSeconds = data.cacheTtlSeconds;
  if (data.dailyQueryLimit !== undefined)
    updateData.dailyQueryLimit = data.dailyQueryLimit;
  if (data.dailyBytesLimit !== undefined) {
    updateData.dailyBytesLimit = BigInt(data.dailyBytesLimit);
  }

  if (data.refreshSchedule !== undefined) {
    updateData.refreshSchedule = data.refreshSchedule;
    updateData.nextRefreshAt = computeNextRefresh(data.refreshSchedule);
  }

  return prisma.dataConnector.update({
    where: { id: connectorId },
    data: updateData,
    select: CONNECTOR_SELECT,
  });
}

export async function deleteConnector(
  userId: string,
  connectorId: string,
): Promise<void> {
  const connector = await prisma.dataConnector.findUnique({
    where: { id: connectorId },
    select: { userId: true, spreadsheetId: true },
  });

  if (!connector) throw new NotFoundError("Connector not found");
  await assertSpreadsheetAccess(userId, connector.spreadsheetId, "editor");

  await prisma.dataConnector.delete({ where: { id: connectorId } });

  logger.info({ userId, connectorId }, "Data connector deleted");
}

// ─── Query execution + caching ──────────────────────────

export async function executeConnectorQuery(
  userId: string,
  connectorId: string,
  forceRefresh = false,
): Promise<{
  columns: string[];
  rows: ConnectorRow[];
  totalRows: number;
  fromCache: boolean;
}> {
  const connector = await prisma.dataConnector.findUnique({
    where: { id: connectorId },
    select: {
      ...CONNECTOR_SELECT,
      userId: true,
      spreadsheetId: true,
      cachedData: true,
    },
  });

  if (!connector) throw new NotFoundError("Connector not found");
  await assertSpreadsheetAccess(userId, connector.spreadsheetId, "viewer");

  if (connector.status === "paused") {
    throw new AppError(409, "Connector is paused");
  }

  // Check cache
  if (!forceRefresh && connector.cachedAt && connector.cachedData) {
    const cacheAge = Date.now() - new Date(connector.cachedAt).getTime();
    if (cacheAge < connector.cacheTtlSeconds * 1000) {
      const cached = connector.cachedData as {
        columns: string[];
        rows: ConnectorRow[];
        totalRows: number;
      };
      return { ...cached, fromCache: true };
    }
  }

  // Enforce quotas
  assertQuota(connector);

  // Get credential if needed
  let credentialJson: string | null = null;
  if (connector.credentialId) {
    const cred = await prisma.dataConnectorCredential.findUnique({
      where: { id: connector.credentialId },
      select: { encryptedConfig: true, userId: true },
    });
    if (cred && cred.userId === userId) {
      credentialJson = decryptCredentialConfig(cred.encryptedConfig);
    }
  }

  // Execute query via driver
  const driver = getDriver(connector.type);
  const config = driver.validateConfig(connector.config);

  let result: ConnectorQueryResult;
  try {
    result = await driver.executeQuery(config, credentialJson);
  } catch (err) {
    const errMsg =
      err instanceof Error ? err.message : "Query execution failed";
    await prisma.dataConnector.update({
      where: { id: connectorId },
      data: { status: "error", lastError: errMsg },
    });
    throw new AppError(502, `Connector query failed: ${errMsg}`);
  }

  // Update cache + quotas
  const cachePayload = {
    columns: result.columns,
    rows: result.rows,
    totalRows: result.totalRows,
  };

  await prisma.dataConnector.update({
    where: { id: connectorId },
    data: {
      cachedData: cachePayload as object,
      cachedAt: new Date(),
      cacheRowCount: result.rows.length,
      lastRefreshAt: new Date(),
      lastError: null,
      status: "active",
      dailyQueryCount: { increment: 1 },
      dailyBytesScanned: connector.dailyBytesScanned + result.bytesProcessed,
      nextRefreshAt: computeNextRefresh(connector.refreshSchedule),
    },
  });

  logger.info(
    {
      connectorId,
      rows: result.totalRows,
      bytesProcessed: result.bytesProcessed.toString(),
    },
    "Connector query executed",
  );

  return { ...cachePayload, fromCache: false };
}

// ─── Cache invalidation ─────────────────────────────────

export async function invalidateCache(
  userId: string,
  connectorId: string,
): Promise<void> {
  const connector = await prisma.dataConnector.findUnique({
    where: { id: connectorId },
    select: { spreadsheetId: true },
  });

  if (!connector) throw new NotFoundError("Connector not found");
  await assertSpreadsheetAccess(userId, connector.spreadsheetId, "editor");

  await prisma.dataConnector.update({
    where: { id: connectorId },
    data: { cachedData: null, cachedAt: null, cacheRowCount: 0 },
  });

  logger.info({ connectorId }, "Connector cache invalidated");
}

// ─── Daily quota reset (call from cron/scheduled job) ───

export async function resetDailyQuotas(): Promise<number> {
  const result = await prisma.dataConnector.updateMany({
    where: { dailyQueryCount: { gt: 0 } },
    data: { dailyQueryCount: 0, dailyBytesScanned: BigInt(0) },
  });

  logger.info({ count: result.count }, "Daily connector quotas reset");
  return result.count;
}

// ─── Connector usage stats (observability) ──────────────

export async function getConnectorStats(
  userId: string,
  connectorId: string,
): Promise<{
  dailyQueryCount: number;
  dailyQueryLimit: number;
  dailyBytesScanned: string;
  dailyBytesLimit: string;
  cacheRowCount: number;
  cacheTtlSeconds: number;
  cachedAt: Date | null;
  lastRefreshAt: Date | null;
  nextRefreshAt: Date | null;
  lastError: string | null;
  status: string;
}> {
  const connector = await prisma.dataConnector.findUnique({
    where: { id: connectorId },
    select: {
      spreadsheetId: true,
      dailyQueryCount: true,
      dailyQueryLimit: true,
      dailyBytesScanned: true,
      dailyBytesLimit: true,
      cacheRowCount: true,
      cacheTtlSeconds: true,
      cachedAt: true,
      lastRefreshAt: true,
      nextRefreshAt: true,
      lastError: true,
      status: true,
    },
  });

  if (!connector) throw new NotFoundError("Connector not found");
  await assertSpreadsheetAccess(userId, connector.spreadsheetId, "viewer");

  return {
    dailyQueryCount: connector.dailyQueryCount,
    dailyQueryLimit: connector.dailyQueryLimit,
    dailyBytesScanned: connector.dailyBytesScanned.toString(),
    dailyBytesLimit: connector.dailyBytesLimit.toString(),
    cacheRowCount: connector.cacheRowCount,
    cacheTtlSeconds: connector.cacheTtlSeconds,
    cachedAt: connector.cachedAt,
    lastRefreshAt: connector.lastRefreshAt,
    nextRefreshAt: connector.nextRefreshAt,
    lastError: connector.lastError,
    status: connector.status,
  };
}

// ─── Due refresh check (for scheduler) ──────────────────

export async function getConnectorsDueForRefresh(): Promise<
  Array<{ id: string; userId: string; spreadsheetId: string; type: string }>
> {
  return prisma.dataConnector.findMany({
    where: {
      status: "active",
      nextRefreshAt: { lte: new Date() },
      refreshSchedule: { not: null },
    },
    select: {
      id: true,
      userId: true,
      spreadsheetId: true,
      type: true,
    },
    take: 50,
  });
}
