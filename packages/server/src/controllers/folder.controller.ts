import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as folderService from "../services/folder.service";

export async function listFolders(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const parentId = (req.query.parentId as string) || null;
    const folders = await folderService.listFolders(req.user.id, parentId);
    res.json(apiSuccess(folders));
  } catch (err) {
    next(err);
  }
}

export async function getFolder(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const folder = await folderService.getFolder(req.params.id, req.user.id);
    res.json(apiSuccess(folder));
  } catch (err) {
    next(err);
  }
}

export async function createFolder(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const folder = await folderService.createFolder(req.user.id, req.body);
    res.status(201).json(apiSuccess(folder));
  } catch (err) {
    next(err);
  }
}

export async function updateFolder(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const folder = await folderService.updateFolder(
      req.params.id,
      req.user.id,
      req.body,
    );
    res.json(apiSuccess(folder));
  } catch (err) {
    next(err);
  }
}

export async function deleteFolder(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    await folderService.deleteFolder(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function moveSpreadsheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    await folderService.moveSpreadsheetToFolder(
      req.params.spreadsheetId,
      req.body.folderId ?? null,
      req.user.id,
    );
    res.json(apiSuccess({ moved: true }));
  } catch (err) {
    next(err);
  }
}

export async function getFolderBreadcrumbs(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const breadcrumbs = await folderService.getFolderBreadcrumbs(
      req.params.id,
      req.user.id,
    );
    res.json(apiSuccess(breadcrumbs));
  } catch (err) {
    next(err);
  }
}
