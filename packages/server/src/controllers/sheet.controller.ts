import type { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

/**
 * Sheet controller — skeleton for Sprint 11 implementation.
 */

export async function listSheets(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: Sprint 11 — implement with sheet.service
    res.json(apiSuccess([]));
  } catch (err) {
    next(err);
  }
}

export async function getSheet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    // TODO: Sprint 11 — implement with sheet.service
    res.json(apiSuccess({ id: sheetId }));
  } catch (err) {
    next(err);
  }
}

export async function createSheet(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: Sprint 11 — implement with sheet.service
    res.status(201).json(apiSuccess({ message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}

export async function updateSheet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    // TODO: Sprint 11 — implement with sheet.service
    res.json(apiSuccess({ id: sheetId, message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}

export async function deleteSheet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    // TODO: Sprint 11 — implement with sheet.service
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
