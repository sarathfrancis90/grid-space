import type { JsonValue } from "@prisma/client/runtime/library";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface SheetData {
  id: string;
  name: string;
  index: number;
  color: string | null;
  isHidden: boolean;
  cellData: JsonValue;
  columnMeta: JsonValue;
  rowMeta: JsonValue;
  frozenRows: number;
  frozenCols: number;
  filterState: JsonValue | null;
  sortState: JsonValue | null;
}

/** Check user has at least viewer access to the spreadsheet */
async function checkViewerAccess(
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
  if (!access) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }
}

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

const SHEET_SELECT = {
  id: true,
  name: true,
  index: true,
  color: true,
  isHidden: true,
  cellData: true,
  columnMeta: true,
  rowMeta: true,
  frozenRows: true,
  frozenCols: true,
  filterState: true,
  sortState: true,
} as const;

/** List all sheets in a spreadsheet */
export async function listSheets(
  spreadsheetId: string,
  userId: string,
): Promise<SheetData[]> {
  await checkViewerAccess(spreadsheetId, userId);

  const sheets = await prisma.sheet.findMany({
    where: { spreadsheetId },
    select: SHEET_SELECT,
    orderBy: { index: "asc" },
  });

  return sheets;
}

/** Get a single sheet */
export async function getSheet(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
): Promise<SheetData> {
  await checkViewerAccess(spreadsheetId, userId);

  const sheet = await prisma.sheet.findFirst({
    where: { id: sheetId, spreadsheetId },
    select: SHEET_SELECT,
  });

  if (!sheet) {
    throw new NotFoundError("Sheet not found");
  }

  return sheet;
}

/** Create a new sheet */
export async function createSheet(
  spreadsheetId: string,
  userId: string,
  name?: string,
  color?: string,
): Promise<SheetData> {
  await checkEditorAccess(spreadsheetId, userId);

  // Determine next index
  const lastSheet = await prisma.sheet.findFirst({
    where: { spreadsheetId },
    orderBy: { index: "desc" },
    select: { index: true },
  });

  const nextIndex = (lastSheet?.index ?? -1) + 1;
  const sheetName = name ?? `Sheet ${nextIndex + 1}`;

  const sheet = await prisma.sheet.create({
    data: {
      spreadsheetId,
      name: sheetName,
      index: nextIndex,
      color: color ?? null,
      cellData: {},
      columnMeta: {},
      rowMeta: {},
    },
    select: SHEET_SELECT,
  });

  // Touch spreadsheet updatedAt
  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { updatedAt: new Date() },
  });

  logger.info({ userId, spreadsheetId, sheetId: sheet.id }, "Sheet created");

  return sheet;
}

/** Update a sheet (name, color, hidden, frozen rows/cols) */
export async function updateSheet(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
  data: {
    name?: string;
    color?: string | null;
    isHidden?: boolean;
    frozenRows?: number;
    frozenCols?: number;
  },
): Promise<SheetData> {
  await checkEditorAccess(spreadsheetId, userId);

  const sheet = await prisma.sheet.findFirst({
    where: { id: sheetId, spreadsheetId },
    select: { id: true },
  });

  if (!sheet) {
    throw new NotFoundError("Sheet not found");
  }

  const updated = await prisma.sheet.update({
    where: { id: sheetId },
    data,
    select: SHEET_SELECT,
  });

  // Touch spreadsheet updatedAt
  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { updatedAt: new Date() },
  });

  logger.info({ userId, spreadsheetId, sheetId }, "Sheet updated");

  return updated;
}

/** Delete a sheet */
export async function deleteSheet(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
): Promise<void> {
  await checkEditorAccess(spreadsheetId, userId);

  // Ensure at least one sheet remains
  const sheetCount = await prisma.sheet.count({
    where: { spreadsheetId },
  });

  if (sheetCount <= 1) {
    throw new ForbiddenError("Cannot delete the last sheet");
  }

  const sheet = await prisma.sheet.findFirst({
    where: { id: sheetId, spreadsheetId },
    select: { id: true },
  });

  if (!sheet) {
    throw new NotFoundError("Sheet not found");
  }

  await prisma.sheet.delete({ where: { id: sheetId } });

  // Touch spreadsheet updatedAt
  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { updatedAt: new Date() },
  });

  logger.info({ userId, spreadsheetId, sheetId }, "Sheet deleted");
}

/** Auto-save: update sheet cell data */
export async function saveCellData(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
  cellData: Record<string, unknown>,
  columnMeta?: Record<string, unknown>,
  rowMeta?: Record<string, unknown>,
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
