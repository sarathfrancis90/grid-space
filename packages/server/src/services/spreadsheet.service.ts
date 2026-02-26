import type { Prisma } from "@prisma/client";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface SpreadsheetSummary {
  id: string;
  title: string;
  isStarred: boolean;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string | null; avatarUrl: string | null };
  role: string;
}

interface SheetDetail {
  id: string;
  name: string;
  index: number;
  color: string | null;
  isHidden: boolean;
  cellData: unknown;
  columnMeta: unknown;
  rowMeta: unknown;
  frozenRows: number;
  frozenCols: number;
  filterState: unknown;
  sortState: unknown;
}

interface SpreadsheetDetail {
  id: string;
  title: string;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  sheets: SheetDetail[];
}

export interface ListOptions {
  filter?: "all" | "owned" | "shared" | "starred";
  search?: string;
  sortBy?: "title" | "updatedAt" | "createdAt";
  sortDir?: "asc" | "desc";
  page: number;
  limit: number;
  skip: number;
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

const DETAIL_SELECT = {
  id: true,
  title: true,
  isStarred: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  sheets: { orderBy: { index: "asc" as const }, select: SHEET_SELECT },
} as const;

/** Check user access — returns role or throws */
async function checkAccess(
  spreadsheetId: string,
  userId: string,
  minRole?: "viewer" | "editor" | "owner",
): Promise<string> {
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

  if (spreadsheet.ownerId === userId) {
    return "owner";
  }

  const access = spreadsheet.access[0];
  if (!access) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }

  const role = access.role;

  if (minRole === "owner" && role !== "owner") {
    throw new ForbiddenError("Only the owner can perform this action");
  }

  if (minRole === "editor" && role !== "editor" && role !== "owner") {
    throw new ForbiddenError("You need editor access to perform this action");
  }

  return role;
}

/** List user's spreadsheets with filtering, search, sort, pagination */
export async function listSpreadsheets(
  userId: string,
  options: ListOptions,
): Promise<{ spreadsheets: SpreadsheetSummary[]; total: number }> {
  const {
    filter,
    search,
    sortBy = "updatedAt",
    sortDir = "desc",
    skip,
    limit,
  } = options;

  const where: Prisma.SpreadsheetWhereInput = {};

  switch (filter) {
    case "owned":
      where.ownerId = userId;
      break;
    case "shared":
      where.access = { some: { userId } };
      where.NOT = { ownerId: userId };
      break;
    case "starred":
      where.OR = [
        { ownerId: userId, isStarred: true },
        { access: { some: { userId } }, isStarred: true },
      ];
      break;
    default:
      where.OR = [{ ownerId: userId }, { access: { some: { userId } } }];
      break;
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const orderBy = { [sortBy]: sortDir };

  const [spreadsheets, total] = await Promise.all([
    prisma.spreadsheet.findMany({
      where,
      select: {
        id: true,
        title: true,
        isStarred: true,
        isTemplate: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, name: true, avatarUrl: true } },
        access: { where: { userId }, select: { role: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.spreadsheet.count({ where }),
  ]);

  const mapped: SpreadsheetSummary[] = spreadsheets.map((s) => ({
    id: s.id,
    title: s.title,
    isStarred: s.isStarred,
    isTemplate: s.isTemplate,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    owner: s.owner,
    role: s.owner.id === userId ? "owner" : (s.access[0]?.role ?? "viewer"),
  }));

  return { spreadsheets: mapped, total };
}

/** Get a single spreadsheet with all sheets */
export async function getSpreadsheet(
  spreadsheetId: string,
  userId: string,
): Promise<SpreadsheetDetail> {
  await checkAccess(spreadsheetId, userId);

  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: DETAIL_SELECT,
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  return spreadsheet;
}

/** Create a new spreadsheet with a default sheet */
export async function createSpreadsheet(
  userId: string,
  title?: string,
): Promise<SpreadsheetDetail> {
  const spreadsheet = await prisma.$transaction(async (tx) => {
    return tx.spreadsheet.create({
      data: {
        title: title ?? "Untitled Spreadsheet",
        ownerId: userId,
        sheets: {
          create: {
            name: "Sheet 1",
            index: 0,
            cellData: {},
            columnMeta: {},
            rowMeta: {},
          },
        },
        access: {
          create: { userId, role: "owner" },
        },
      },
      select: DETAIL_SELECT,
    });
  });

  logger.info({ userId, spreadsheetId: spreadsheet.id }, "Spreadsheet created");

  return spreadsheet;
}

/** Update spreadsheet metadata (title, starred) */
export async function updateSpreadsheet(
  spreadsheetId: string,
  userId: string,
  data: { title?: string; isStarred?: boolean },
): Promise<SpreadsheetDetail> {
  await checkAccess(spreadsheetId, userId, "editor");

  const spreadsheet = await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data,
    select: DETAIL_SELECT,
  });

  return spreadsheet;
}

/** Delete a spreadsheet (owner only) */
export async function deleteSpreadsheet(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  await checkAccess(spreadsheetId, userId, "owner");

  await prisma.spreadsheet.delete({ where: { id: spreadsheetId } });

  logger.info({ userId, spreadsheetId }, "Spreadsheet deleted");
}

/** Duplicate a spreadsheet */
export async function duplicateSpreadsheet(
  spreadsheetId: string,
  userId: string,
): Promise<SpreadsheetDetail> {
  await checkAccess(spreadsheetId, userId);

  const original = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      title: true,
      sheets: {
        orderBy: { index: "asc" },
        select: {
          name: true,
          index: true,
          color: true,
          cellData: true,
          columnMeta: true,
          rowMeta: true,
          frozenRows: true,
          frozenCols: true,
        },
      },
    },
  });

  if (!original) {
    throw new NotFoundError("Spreadsheet not found");
  }

  const copy = await prisma.$transaction(async (tx) => {
    return tx.spreadsheet.create({
      data: {
        title: `${original.title} (Copy)`,
        ownerId: userId,
        sheets: {
          create: original.sheets.map((s) => ({
            name: s.name,
            index: s.index,
            color: s.color,
            cellData: s.cellData ?? {},
            columnMeta: s.columnMeta ?? {},
            rowMeta: s.rowMeta ?? {},
            frozenRows: s.frozenRows,
            frozenCols: s.frozenCols,
          })),
        },
        access: {
          create: { userId, role: "owner" },
        },
      },
      select: DETAIL_SELECT,
    });
  });

  logger.info(
    { userId, sourceId: spreadsheetId, newId: copy.id },
    "Spreadsheet duplicated",
  );

  return copy;
}

/** Toggle star/favorite */
export async function toggleStar(
  spreadsheetId: string,
  userId: string,
): Promise<{ isStarred: boolean }> {
  await checkAccess(spreadsheetId, userId);

  const current = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: { isStarred: true },
  });

  if (!current) {
    throw new NotFoundError("Spreadsheet not found");
  }

  const updated = await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { isStarred: !current.isStarred },
    select: { isStarred: true },
  });

  return { isStarred: updated.isStarred };
}
