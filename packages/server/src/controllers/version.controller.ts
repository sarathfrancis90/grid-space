import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { getPaginationParams } from "../utils/pagination";
import * as versionService from "../services/version.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

/** POST /api/spreadsheets/:id/versions — create a version snapshot */
export async function createVersion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }

    const version = await versionService.createVersion(id, req.user.id);

    res.status(201).json(apiSuccess(version));
  } catch (err) {
    next(err);
  }
}

/** GET /api/spreadsheets/:id/versions — list versions */
export async function listVersions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }

    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string },
    );

    const { versions, total } = await versionService.listVersions(
      id,
      req.user.id,
      { page, limit, skip },
    );

    res.json(apiPaginated(versions, page, limit, total));
  } catch (err) {
    next(err);
  }
}

/** GET /api/spreadsheets/:id/versions/grouped — list grouped by time */
export async function listGroupedVersions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }

    const groups = await versionService.listGroupedVersions(id, req.user.id);

    res.json(apiSuccess(groups));
  } catch (err) {
    next(err);
  }
}

/** GET /api/spreadsheets/:id/versions/:versionId — get single version */
export async function getVersion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    const versionId = paramStr(req.params.versionId);
    if (!id || !versionId) {
      throw new AppError(400, "Spreadsheet ID and version ID are required");
    }

    const version = await versionService.getVersion(id, versionId, req.user.id);

    res.json(apiSuccess(version));
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/versions/:versionId/restore — restore version */
export async function restoreVersion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    const versionId = paramStr(req.params.versionId);
    if (!id || !versionId) {
      throw new AppError(400, "Spreadsheet ID and version ID are required");
    }

    await versionService.restoreVersion(id, versionId, req.user.id);

    res.json(apiSuccess({ message: "Version restored successfully" }));
  } catch (err) {
    next(err);
  }
}

/** PUT /api/spreadsheets/:id/versions/:versionId/name — name a version */
export async function nameVersion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    const versionId = paramStr(req.params.versionId);
    if (!id || !versionId) {
      throw new AppError(400, "Spreadsheet ID and version ID are required");
    }

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      throw new AppError(400, "Version name is required");
    }

    const version = await versionService.nameVersion(
      id,
      versionId,
      req.user.id,
      name,
    );

    res.json(apiSuccess(version));
  } catch (err) {
    next(err);
  }
}

/** GET /api/spreadsheets/:id/versions/:versionId/diff — get diff */
export async function diffVersions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    const versionId = paramStr(req.params.versionId);
    if (!id || !versionId) {
      throw new AppError(400, "Spreadsheet ID and version ID are required");
    }

    const compareToId = req.query.compareToId as string | undefined;

    const diffs = await versionService.diffVersions(
      id,
      versionId,
      compareToId,
      req.user.id,
    );

    res.json(apiSuccess(diffs));
  } catch (err) {
    next(err);
  }
}

/** POST /api/spreadsheets/:id/versions/:versionId/copy — copy as new spreadsheet */
export async function copyVersionAsSpreadsheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    const versionId = paramStr(req.params.versionId);
    if (!id || !versionId) {
      throw new AppError(400, "Spreadsheet ID and version ID are required");
    }

    const result = await versionService.copyVersionAsSpreadsheet(
      id,
      versionId,
      req.user.id,
    );

    res.status(201).json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}
