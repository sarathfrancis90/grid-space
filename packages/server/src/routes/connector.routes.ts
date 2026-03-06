import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as connectorController from "../controllers/connector.controller";

// ─── Credential routes (user-scoped) ────────────────────

export const credentialRouter = Router();
credentialRouter.use(authenticate);

const createCredentialSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
    type: z.enum(["bigquery", "postgresql", "mysql", "csv_url"]),
    config: z.record(z.string(), z.unknown()),
  }),
};

credentialRouter.get("/", connectorController.listCredentials);

credentialRouter.post(
  "/",
  writeLimiter,
  validate(createCredentialSchema),
  connectorController.createCredential,
);

credentialRouter.delete(
  "/:id",
  writeLimiter,
  connectorController.deleteCredential,
);

// ─── Connector routes (spreadsheet-scoped) ──────────────

const connectorRouter = Router({ mergeParams: true });
connectorRouter.use(authenticate);

const createConnectorSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
    type: z.enum(["bigquery", "postgresql", "mysql", "csv_url"]),
    config: z.record(z.string(), z.unknown()),
    credentialId: z.string().max(200).optional(),
    sheetId: z.string().max(200).optional(),
    refreshSchedule: z
      .enum([
        "manual",
        "every_5m",
        "every_15m",
        "every_30m",
        "every_1h",
        "every_4h",
        "every_12h",
        "every_24h",
      ])
      .optional(),
    cacheTtlSeconds: z.number().int().min(0).max(86400).optional(),
    dailyQueryLimit: z.number().int().min(1).max(10000).optional(),
    dailyBytesLimit: z.string().max(30).optional(),
  }),
};

const updateConnectorSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    credentialId: z.string().max(200).nullable().optional(),
    sheetId: z.string().max(200).nullable().optional(),
    refreshSchedule: z
      .enum([
        "manual",
        "every_5m",
        "every_15m",
        "every_30m",
        "every_1h",
        "every_4h",
        "every_12h",
        "every_24h",
      ])
      .nullable()
      .optional(),
    cacheTtlSeconds: z.number().int().min(0).max(86400).optional(),
    dailyQueryLimit: z.number().int().min(1).max(10000).optional(),
    dailyBytesLimit: z.string().max(30).optional(),
    status: z.enum(["active", "paused"]).optional(),
  }),
};

// GET /api/spreadsheets/:spreadsheetId/connectors
connectorRouter.get("/", connectorController.listConnectors);

// POST /api/spreadsheets/:spreadsheetId/connectors
connectorRouter.post(
  "/",
  writeLimiter,
  validate(createConnectorSchema),
  connectorController.createConnector,
);

// GET /api/spreadsheets/:spreadsheetId/connectors/:connectorId
connectorRouter.get("/:connectorId", connectorController.getConnector);

// PATCH /api/spreadsheets/:spreadsheetId/connectors/:connectorId
connectorRouter.patch(
  "/:connectorId",
  writeLimiter,
  validate(updateConnectorSchema),
  connectorController.updateConnector,
);

// DELETE /api/spreadsheets/:spreadsheetId/connectors/:connectorId
connectorRouter.delete(
  "/:connectorId",
  writeLimiter,
  connectorController.deleteConnector,
);

// POST /api/spreadsheets/:spreadsheetId/connectors/:connectorId/query
connectorRouter.post(
  "/:connectorId/query",
  writeLimiter,
  connectorController.executeQuery,
);

// POST /api/spreadsheets/:spreadsheetId/connectors/:connectorId/invalidate-cache
connectorRouter.post(
  "/:connectorId/invalidate-cache",
  writeLimiter,
  connectorController.invalidateCache,
);

// GET /api/spreadsheets/:spreadsheetId/connectors/:connectorId/stats
connectorRouter.get(
  "/:connectorId/stats",
  connectorController.getConnectorStats,
);

export default connectorRouter;
