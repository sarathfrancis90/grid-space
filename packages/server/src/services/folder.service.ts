import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

const FOLDER_SELECT = {
  id: true,
  name: true,
  color: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
};

interface FolderResult {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function listFolders(
  userId: string,
  parentId: string | null,
): Promise<FolderResult[]> {
  const folders = await prisma.folder.findMany({
    where: { userId, parentId: parentId ?? null },
    select: FOLDER_SELECT,
    orderBy: { name: "asc" },
  });
  return folders;
}

export async function getFolder(
  id: string,
  userId: string,
): Promise<FolderResult> {
  const folder = await prisma.folder.findUnique({
    where: { id },
    select: { ...FOLDER_SELECT, userId: true },
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  if (folder.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  const { userId: _uid, ...rest } = folder;
  return rest;
}

export async function createFolder(
  userId: string,
  data: { name: string; color?: string; parentId?: string },
): Promise<FolderResult> {
  if (data.parentId) {
    const parent = await prisma.folder.findUnique({
      where: { id: data.parentId },
      select: { userId: true },
    });
    if (!parent || parent.userId !== userId) {
      throw new NotFoundError("Parent folder not found");
    }
  }

  const folder = await prisma.folder.create({
    data: {
      name: data.name,
      color: data.color,
      userId,
      parentId: data.parentId ?? null,
    },
    select: FOLDER_SELECT,
  });

  logger.info({ folderId: folder.id, userId }, "Folder created");
  return folder;
}

export async function updateFolder(
  id: string,
  userId: string,
  data: { name?: string; color?: string },
): Promise<FolderResult> {
  const existing = await prisma.folder.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Folder not found");
  }
  if (existing.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  const folder = await prisma.folder.update({
    where: { id },
    data,
    select: FOLDER_SELECT,
  });

  logger.info({ folderId: id, userId }, "Folder updated");
  return folder;
}

export async function deleteFolder(id: string, userId: string): Promise<void> {
  const existing = await prisma.folder.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Folder not found");
  }
  if (existing.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  await prisma.$transaction(async (tx) => {
    // Unset folderId on spreadsheets in this folder
    await tx.spreadsheet.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });
    // Delete the folder (cascade deletes child folders)
    await tx.folder.delete({ where: { id } });
  });

  logger.info({ folderId: id, userId }, "Folder deleted");
}

export async function moveSpreadsheetToFolder(
  spreadsheetId: string,
  folderId: string | null,
  userId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: { ownerId: true },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }
  if (spreadsheet.ownerId !== userId) {
    throw new ForbiddenError("Only the owner can move spreadsheets");
  }

  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { userId: true },
    });
    if (!folder || folder.userId !== userId) {
      throw new NotFoundError("Folder not found");
    }
  }

  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { folderId },
  });

  logger.info(
    { spreadsheetId, folderId, userId },
    "Spreadsheet moved to folder",
  );
}

export async function getFolderBreadcrumbs(
  folderId: string,
  userId: string,
): Promise<Array<{ id: string; name: string }>> {
  const breadcrumbs: Array<{ id: string; name: string }> = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true, userId: true },
    });

    if (!folder || folder.userId !== userId) break;

    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return breadcrumbs;
}
