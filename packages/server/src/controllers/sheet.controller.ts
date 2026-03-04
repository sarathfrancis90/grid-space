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

    const id = paramStr(req.params.id);
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }

    const sheets = await sheetService.listSheets(id, req.user.id);

    res.json(apiSuccess(sheets));
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

    const id = paramStr(req.params.id);
    const sheetId = paramStr(req.params.sheetId);
    if (!id || !sheetId) {
      throw new AppError(400, "Spreadsheet ID and Sheet ID are required");
    }

    const sheet = await sheetService.getSheet(id, sheetId, req.user.id);

    res.json(apiSuccess(sheet));
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

    const id = paramStr(req.params.id);
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }

    const { name, color } = req.body;

    const sheet = await sheetService.createSheet(id, req.user.id, name, color);

    res.status(201).json(apiSuccess(sheet));
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

    const id = paramStr(req.params.id);
    const sheetId = paramStr(req.params.sheetId);
    if (!id || !sheetId) {
      throw new AppError(400, "Spreadsheet ID and Sheet ID are required");
    }

    const { name, color, isHidden, frozenRows, frozenCols } = req.body;

    const sheet = await sheetService.updateSheet(id, sheetId, req.user.id, {
      name,
      color,
      isHidden,
      frozenRows,
      frozenCols,
    });

    res.json(apiSuccess(sheet));
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

    const id = paramStr(req.params.id);
    const sheetId = paramStr(req.params.sheetId);
    if (!id || !sheetId) {
      throw new AppError(400, "Spreadsheet ID and Sheet ID are required");
    }

    await sheetService.deleteSheet(id, sheetId, req.user.id);

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
