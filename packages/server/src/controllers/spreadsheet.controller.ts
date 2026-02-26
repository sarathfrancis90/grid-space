import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { getPaginationParams } from "../utils/pagination";
import * as spreadsheetService from "../services/spreadsheet.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

export async function listSpreadsheets(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string },
    );

    const filter = (req.query.filter as string) || "all";
    const search = (req.query.search as string) || undefined;
    const sortBy = (req.query.sortBy as string) || "updatedAt";
    const sortDir = (req.query.sortDir as string) || "desc";

    const { spreadsheets, total } = await spreadsheetService.listSpreadsheets(
      req.user.id,
      {
        filter: filter as "all" | "owned" | "shared" | "starred",
        search,
        sortBy: sortBy as "title" | "updatedAt" | "createdAt",
        sortDir: sortDir as "asc" | "desc",
        page,
        limit,
        skip,
      },
    );

    res.json(apiPaginated(spreadsheets, page, limit, total));
  } catch (err) {
    next(err);
  }
}

export async function getSpreadsheet(
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

    const spreadsheet = await spreadsheetService.getSpreadsheet(
      id,
      req.user.id,
    );

    res.json(apiSuccess(spreadsheet));
  } catch (err) {
    next(err);
  }
}

export async function createSpreadsheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const { title } = req.body;

    const spreadsheet = await spreadsheetService.createSpreadsheet(
      req.user.id,
      title,
    );

    res.status(201).json(apiSuccess(spreadsheet));
  } catch (err) {
    next(err);
  }
}

export async function updateSpreadsheet(
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

    const { title, isStarred } = req.body;

    const spreadsheet = await spreadsheetService.updateSpreadsheet(
      id,
      req.user.id,
      { title, isStarred },
    );

    res.json(apiSuccess(spreadsheet));
  } catch (err) {
    next(err);
  }
}

export async function deleteSpreadsheet(
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

    await spreadsheetService.deleteSpreadsheet(id, req.user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function duplicateSpreadsheet(
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

    const copy = await spreadsheetService.duplicateSpreadsheet(id, req.user.id);

    res.status(201).json(apiSuccess(copy));
  } catch (err) {
    next(err);
  }
}

export async function toggleStar(
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

    const result = await spreadsheetService.toggleStar(id, req.user.id);

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}
