import prisma from "../models/prisma";
import { AppError, NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface FolderSummary {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { children: number; spreadsheets: number };
}

export async function listFolders(
  userId: string,
  parentId: string | null,
): Promise<FolderSummary[]> {
  const folders = await prisma.folder.findMany({
    where: {
      userId,
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true, spreadsheets: true } },
    },
    orderBy: { name: "asc" },
  });

  return folders;
}

export async function getFolder(userId: string, folderId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      id: true,
      name: true,
      parentId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true, spreadsheets: true } },
    },
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }

  if (folder.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    _count: folder._count,
  };
}

export async function getFolderBreadcrumbs(
  userId: string,
  folderId: string,
): Promise<Array<{ id: string; name: string }>> {
  const breadcrumbs: Array<{ id: string; name: string }> = [];
  let currentId: string | null = folderId;

  // Walk up the folder tree (max 20 levels to prevent infinite loops)
  for (let i = 0; i < 20 && currentId; i++) {
    const folder: {
      id: string;
      name: string;
      parentId: string | null;
      userId: string;
    } | null = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true, userId: true },
    });

    if (!folder || folder.userId !== userId) {
      break;
    }

    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return breadcrumbs;
}

export async function createFolder(
  userId: string,
  name: string,
  parentId: string | null,
) {
  // Validate parent exists and belongs to user
  if (parentId) {
    const parent = await prisma.folder.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });

    if (!parent) {
      throw new NotFoundError("Parent folder not found");
    }
    if (parent.userId !== userId) {
      throw new ForbiddenError("Access denied to parent folder");
    }
  }

  const folder = await prisma.folder.create({
    data: {
      name,
      userId,
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true, spreadsheets: true } },
    },
  });

  logger.info({ userId, folderId: folder.id }, "Folder created");
  return folder;
}

export async function updateFolder(
  userId: string,
  folderId: string,
  data: { name?: string },
) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { userId: true },
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }
  if (folder.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true, spreadsheets: true } },
    },
  });

  logger.info({ userId, folderId }, "Folder updated");
  return updated;
}

export async function deleteFolder(userId: string, folderId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { userId: true },
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }
  if (folder.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  // Cascade delete will remove children folders.
  // Spreadsheets in this folder will have folderId set to null (onDelete: SetNull).
  await prisma.folder.delete({
    where: { id: folderId },
  });

  logger.info({ userId, folderId }, "Folder deleted");
}

export async function moveSpreadsheetToFolder(
  userId: string,
  spreadsheetId: string,
  folderId: string | null,
) {
  // Verify spreadsheet ownership
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

  // Verify target folder belongs to user
  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { userId: true },
    });

    if (!folder) {
      throw new NotFoundError("Target folder not found");
    }
    if (folder.userId !== userId) {
      throw new ForbiddenError("Access denied to target folder");
    }
  }

  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { folderId: folderId ?? null },
  });

  logger.info(
    { userId, spreadsheetId, folderId },
    "Spreadsheet moved to folder",
  );
}

export async function moveFolderToFolder(
  userId: string,
  folderId: string,
  targetParentId: string | null,
) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { userId: true },
  });

  if (!folder) {
    throw new NotFoundError("Folder not found");
  }
  if (folder.userId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  // Prevent moving folder into itself
  if (targetParentId === folderId) {
    throw new AppError(422, "Cannot move a folder into itself");
  }

  // Prevent moving folder into one of its descendants
  if (targetParentId) {
    const targetFolder = await prisma.folder.findUnique({
      where: { id: targetParentId },
      select: { userId: true },
    });

    if (!targetFolder) {
      throw new NotFoundError("Target folder not found");
    }
    if (targetFolder.userId !== userId) {
      throw new ForbiddenError("Access denied to target folder");
    }

    // Walk up from target to check for circular reference
    let currentId: string | null = targetParentId;
    for (let i = 0; i < 20 && currentId; i++) {
      if (currentId === folderId) {
        throw new AppError(422, "Cannot move a folder into its own descendant");
      }
      const current: { parentId: string | null } | null =
        await prisma.folder.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });
      currentId = current?.parentId ?? null;
    }
  }

  await prisma.folder.update({
    where: { id: folderId },
    data: { parentId: targetParentId ?? null },
  });

  logger.info({ userId, folderId, targetParentId }, "Folder moved");
}
