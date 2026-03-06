import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as connectorService from "../services/connector.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

// ─── Credentials ────────────────────────────────────────

export async function createCredential(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const { name, type, config } = req.body;
    const cred = await connectorService.createCredential(
      req.user.id,
      name,
      type,
      JSON.stringify(config),
    );
    res.status(201).json(apiSuccess(cred));
  } catch (err) {
    next(err);
  }
}

export async function listCredentials(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const creds = await connectorService.listCredentials(req.user.id);
    res.json(apiSuccess(creds));
  } catch (err) {
    next(err);
  }
}

export async function deleteCredential(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    await connectorService.deleteCredential(req.user.id, id);
    res.json(apiSuccess({ deleted: true }));
  } catch (err) {
    next(err);
  }
}

// ─── Connectors ─────────────────────────────────────────

export async function createConnector(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const spreadsheetId = paramStr(req.params.spreadsheetId);
    const connector = await connectorService.createConnector(
      req.user.id,
      spreadsheetId,
      req.body,
    );
    res.status(201).json(apiSuccess(connector));
  } catch (err) {
    next(err);
  }
}

export async function listConnectors(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const spreadsheetId = paramStr(req.params.spreadsheetId);
    const connectors = await connectorService.listConnectors(
      req.user.id,
      spreadsheetId,
    );
    res.json(apiSuccess(connectors));
  } catch (err) {
    next(err);
  }
}

export async function getConnector(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const connectorId = paramStr(req.params.connectorId);
    const connector = await connectorService.getConnector(
      req.user.id,
      connectorId,
    );
    res.json(apiSuccess(connector));
  } catch (err) {
    next(err);
  }
}

export async function updateConnector(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const connectorId = paramStr(req.params.connectorId);
    const connector = await connectorService.updateConnector(
      req.user.id,
      connectorId,
      req.body,
    );
    res.json(apiSuccess(connector));
  } catch (err) {
    next(err);
  }
}

export async function deleteConnector(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const connectorId = paramStr(req.params.connectorId);
    await connectorService.deleteConnector(req.user.id, connectorId);
    res.json(apiSuccess({ deleted: true }));
  } catch (err) {
    next(err);
  }
}

// ─── Query execution ────────────────────────────────────

export async function executeQuery(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const connectorId = paramStr(req.params.connectorId);
    const forceRefresh = req.query.forceRefresh === "true";
    const result = await connectorService.executeConnectorQuery(
      req.user.id,
      connectorId,
      forceRefresh,
    );
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

export async function invalidateCache(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const connectorId = paramStr(req.params.connectorId);
    await connectorService.invalidateCache(req.user.id, connectorId);
    res.json(apiSuccess({ invalidated: true }));
  } catch (err) {
    next(err);
  }
}

// ─── Stats / observability ──────────────────────────────

export async function getConnectorStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const connectorId = paramStr(req.params.connectorId);
    const stats = await connectorService.getConnectorStats(
      req.user.id,
      connectorId,
    );
    res.json(apiSuccess(stats));
  } catch (err) {
    next(err);
  }
}
