import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";

async function checkAccess(
  spreadsheetId: string,
  userId: string,
): Promise<string> {
  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!ss) throw new NotFoundError("Spreadsheet not found");
  if (ss.ownerId === userId) return "owner";
  const role = ss.access[0]?.role;
  if (!role) throw new ForbiddenError("Access denied");
  return role;
}

export async function listFilterViews(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
) {
  await checkAccess(spreadsheetId, userId);

  const filterViews = await prisma.filterView.findMany({
    where: { spreadsheetId, sheetId, userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      filters: true,
      sheetId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return filterViews;
}

export async function createFilterView(
  spreadsheetId: string,
  sheetId: string,
  userId: string,
  name: string,
  filters: unknown[],
) {
  await checkAccess(spreadsheetId, userId);

  const filterView = await prisma.filterView.create({
    data: {
      spreadsheetId,
      sheetId,
      userId,
      name,
      filters: JSON.parse(JSON.stringify(filters)),
    },
    select: {
      id: true,
      name: true,
      filters: true,
      sheetId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return filterView;
}

export async function updateFilterView(
  filterViewId: string,
  userId: string,
  data: { name?: string; filters?: unknown[] },
) {
  const fv = await prisma.filterView.findUnique({
    where: { id: filterViewId },
    select: { userId: true, spreadsheetId: true },
  });

  if (!fv) throw new NotFoundError("Filter view not found");
  if (fv.userId !== userId) throw new ForbiddenError("Access denied");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.filters !== undefined)
    updateData.filters = JSON.parse(JSON.stringify(data.filters));

  const updated = await prisma.filterView.update({
    where: { id: filterViewId },
    data: updateData,
    select: {
      id: true,
      name: true,
      filters: true,
      sheetId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function deleteFilterView(filterViewId: string, userId: string) {
  const fv = await prisma.filterView.findUnique({
    where: { id: filterViewId },
    select: { userId: true },
  });

  if (!fv) throw new NotFoundError("Filter view not found");
  if (fv.userId !== userId) throw new ForbiddenError("Access denied");

  await prisma.filterView.delete({ where: { id: filterViewId } });
}
