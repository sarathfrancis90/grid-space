import type { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

/**
 * Cell controller — skeleton for Sprint 11 implementation.
 */

export async function getCells(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    // TODO: Sprint 11 — implement with cell.service
    res.json(apiSuccess({ sheetId, cells: {} }));
  } catch (err) {
    next(err);
  }
}

export async function updateCells(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sheetId } = req.params;
    if (!sheetId) {
      throw new AppError(400, "Sheet ID is required");
    }
    // TODO: Sprint 11 — implement with cell.service
    res.json(apiSuccess({ sheetId, message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}
