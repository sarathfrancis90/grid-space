import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface FilterViewData {
  id: string;
  spreadsheetId: string;
  sheetId: string;
  userId: string;
  name: string;
  criteria: unknown;
  createdAt: Date;
  updatedAt: Date;
}

async function checkSpreadsheetAccess(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      deletedAt: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!spreadsheet || spreadsheet.deletedAt) {
    throw new NotFoundError("Spreadsheet not found");
  }

  const isOwner = spreadsheet.ownerId === userId;
  const hasAccess = spreadsheet.access.length > 0;

  if (!isOwner && !hasAccess) {
    throw new ForbiddenError("Access denied");
  }
}

/** List filter views for a user on a specific spreadsheet/sheet */
export async function listFilterViews(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
): Promise<FilterViewData[]> {
  await checkSpreadsheetAccess(spreadsheetId, userId);

  return prisma.filterView.findMany({
    where: { spreadsheetId, sheetId, userId },
    orderBy: { updatedAt: "desc" },
  });
}

/** Create a new filter view */
export async function createFilterView(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
  name: string,
  criteria: unknown,
): Promise<FilterViewData> {
  await checkSpreadsheetAccess(spreadsheetId, userId);

  const filterView = await prisma.filterView.create({
    data: {
      spreadsheetId,
      sheetId,
      userId,
      name,
      criteria: criteria as object,
    },
  });

  logger.info(
    { userId, spreadsheetId, filterViewId: filterView.id },
    "Filter view created",
  );

  return filterView;
}

/** Update a filter view (name and/or criteria) */
export async function updateFilterView(
  filterViewId: string,
  userId: string,
  data: { name?: string; criteria?: unknown },
): Promise<FilterViewData> {
  const existing = await prisma.filterView.findUnique({
    where: { id: filterViewId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Filter view not found");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("Cannot edit another user's filter view");
  }

  const updateData: { name?: string; criteria?: object } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.criteria !== undefined)
    updateData.criteria = data.criteria as object;

  const filterView = await prisma.filterView.update({
    where: { id: filterViewId },
    data: updateData,
  });

  logger.info({ userId, filterViewId }, "Filter view updated");

  return filterView;
}

/** Delete a filter view */
export async function deleteFilterView(
  filterViewId: string,
  userId: string,
): Promise<void> {
  const existing = await prisma.filterView.findUnique({
    where: { id: filterViewId },
    select: { userId: true },
  });

  if (!existing) {
    throw new NotFoundError("Filter view not found");
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError("Cannot delete another user's filter view");
  }

  await prisma.filterView.delete({ where: { id: filterViewId } });

  logger.info({ userId, filterViewId }, "Filter view deleted");
}
