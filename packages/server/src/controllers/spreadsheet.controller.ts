import type { Request, Response, NextFunction } from "express";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

/**
 * Spreadsheet controller — skeleton for Sprint 11 implementation.
 * Route → Controller → Service → Prisma pattern.
 */

export async function listSpreadsheets(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: Sprint 11 — implement with spreadsheet.service
    res.json(apiSuccess([]));
  } catch (err) {
    next(err);
  }
}

export async function getSpreadsheet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }
    // TODO: Sprint 11 — implement with spreadsheet.service
    res.json(apiSuccess({ id }));
  } catch (err) {
    next(err);
  }
}

export async function createSpreadsheet(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: Sprint 11 — implement with spreadsheet.service
    res.status(201).json(apiSuccess({ message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}

export async function updateSpreadsheet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }
    // TODO: Sprint 11 — implement with spreadsheet.service
    res.json(apiSuccess({ id, message: "Not implemented" }));
  } catch (err) {
    next(err);
  }
}

export async function deleteSpreadsheet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, "Spreadsheet ID is required");
    }
    // TODO: Sprint 11 — implement with spreadsheet.service
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
