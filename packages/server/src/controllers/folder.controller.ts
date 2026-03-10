import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as folderService from "../services/folder.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

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

    const folder = await folderService.getFolder(
      req.user.id,
      paramStr(req.params.id),
    );
    res.json(apiSuccess(folder));
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
      req.user.id,
      paramStr(req.params.id),
    );
    res.json(apiSuccess(breadcrumbs));
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

    const { name, parentId } = req.body as {
      name: string;
      parentId?: string | null;
    };

    const folder = await folderService.createFolder(
      req.user.id,
      name,
      parentId ?? null,
    );
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

    const { name } = req.body as { name?: string };
    const folder = await folderService.updateFolder(
      req.user.id,
      paramStr(req.params.id),
      {
        name,
      },
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

    await folderService.deleteFolder(req.user.id, paramStr(req.params.id));
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

    const { spreadsheetId, folderId } = req.body as {
      spreadsheetId: string;
      folderId: string | null;
    };

    await folderService.moveSpreadsheetToFolder(
      req.user.id,
      spreadsheetId,
      folderId,
    );
    res.json(apiSuccess({ moved: true }));
  } catch (err) {
    next(err);
  }
}

export async function moveFolder(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    const { targetParentId } = req.body as {
      targetParentId: string | null;
    };

    await folderService.moveFolderToFolder(
      req.user.id,
      paramStr(req.params.id),
      targetParentId,
    );
    res.json(apiSuccess({ moved: true }));
  } catch (err) {
    next(err);
  }
}
