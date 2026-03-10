import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as filterViewService from "../services/filterView.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listFilterViews(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const sheetId = req.query.sheetId as string;

    if (!sheetId) {
      throw new AppError(422, "sheetId query parameter is required");
    }

    const filterViews = await filterViewService.listFilterViews(
      spreadsheetId,
      sheetId,
      req.user.id,
    );

    res.json(apiSuccess(filterViews));
  } catch (err) {
    next(err);
  }
}

export async function createFilterView(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const { sheetId, name, filters } = req.body;

    const filterView = await filterViewService.createFilterView(
      spreadsheetId,
      sheetId,
      req.user.id,
      name,
      filters,
    );

    res.status(201).json(apiSuccess(filterView));
  } catch (err) {
    next(err);
  }
}

export async function updateFilterView(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const filterViewId = paramStr(req.params.filterViewId);
    const { name, filters } = req.body;

    const updated = await filterViewService.updateFilterView(
      filterViewId,
      req.user.id,
      { name, filters },
    );

    res.json(apiSuccess(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteFilterView(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const filterViewId = paramStr(req.params.filterViewId);

    await filterViewService.deleteFilterView(filterViewId, req.user.id);

    res.json(apiSuccess({ deleted: true }));
  } catch (err) {
    next(err);
  }
}
