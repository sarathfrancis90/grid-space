import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as sheetService from "../services/sheet.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

export async function listSheets(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }
    // Stub: return empty list (full implementation in future)
    res.json(apiSuccess([]));
  } catch (err) {
    next(err);
  }
}

export async function getSheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    res.json(apiSuccess({ id: sheetId }));
  } catch (err) {
    next(err);
  }
}

export async function createSheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }
    res.status(201).json(apiSuccess({ message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}

export async function updateSheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    res.json(apiSuccess({ id: sheetId, message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}

export async function deleteSheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** Auto-save endpoint: save sheet cell data */
export async function saveSheetData(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const id = paramStr(req.params.id);
    const sheetId = paramStr(req.params.sheetId);
    if (!id || !sheetId) {
      throw new AppError(400, "Spreadsheet ID and Sheet ID are required");
    }

    const { cellData, columnMeta, rowMeta } = req.body;

    const result = await sheetService.saveCellData(
      id,
      sheetId,
      req.user.id,
      cellData,
      columnMeta,
      rowMeta,
    );

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}
