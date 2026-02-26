import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

/** Check user has at least editor access to the spreadsheet */
async function checkEditorAccess(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  if (spreadsheet.ownerId === userId) return;

  const access = spreadsheet.access[0];
  if (!access || (access.role !== "editor" && access.role !== "owner")) {
    throw new ForbiddenError("You need editor access to modify sheets");
  }
}

/** Auto-save: update sheet cell data */
export async function saveCellData(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
  cellData: unknown,
  columnMeta?: unknown,
  rowMeta?: unknown,
): Promise<{ updatedAt: Date }> {
  await checkEditorAccess(spreadsheetId, userId);

  const sheet = await prisma.sheet.findFirst({
    where: { id: sheetId, spreadsheetId },
    select: { id: true },
  });

  if (!sheet) {
    throw new NotFoundError("Sheet not found");
  }

  const updateData: Record<string, unknown> = { cellData };
  if (columnMeta !== undefined) updateData.columnMeta = columnMeta;
  if (rowMeta !== undefined) updateData.rowMeta = rowMeta;

  const updated = await prisma.sheet.update({
    where: { id: sheetId },
    data: updateData,
    select: { updatedAt: true },
  });

  // Also touch spreadsheet updatedAt
  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { updatedAt: new Date() },
  });

  logger.info({ userId, spreadsheetId, sheetId }, "Sheet data saved");

  return { updatedAt: updated.updatedAt };
}
