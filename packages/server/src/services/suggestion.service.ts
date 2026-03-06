import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface SuggestionWithAuthor {
  id: string;
  spreadsheetId: string;
  sheetId: string;
  cellKey: string;
  oldValue: string | null;
  newValue: string | null;
  oldFormula: string | null;
  newFormula: string | null;
  status: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

const SUGGESTION_SELECT = {
  id: true,
  spreadsheetId: true,
  sheetId: true,
  cellKey: true,
  oldValue: true,
  newValue: true,
  oldFormula: true,
  newFormula: true,
  status: true,
  authorId: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
};

async function verifyAccess(
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
  if (!spreadsheet) throw new NotFoundError("Spreadsheet not found");
  if (spreadsheet.ownerId !== userId && spreadsheet.access.length === 0) {
    throw new ForbiddenError("Access denied");
  }
}

export async function listSuggestions(
  spreadsheetId: string,
  userId: string,
  sheetId?: string,
): Promise<SuggestionWithAuthor[]> {
  await verifyAccess(spreadsheetId, userId);

  const where: Record<string, unknown> = { spreadsheetId };
  if (sheetId) where.sheetId = sheetId;

  const suggestions = await prisma.suggestion.findMany({
    where,
    select: {
      ...SUGGESTION_SELECT,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch author details for each suggestion
  const authorIds = [...new Set(suggestions.map((s: { authorId: string }) => s.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, email: true },
  });
  const authorMap = new Map(authors.map((a: { id: string; name: string | null; email: string }) => [a.id, a]));

  return suggestions.map((s: { authorId: string } & Record<string, unknown>) => ({
    ...s,
    author: authorMap.get(s.authorId) ?? {
      id: s.authorId,
      name: null,
      email: "",
    },
  }));
}

export async function createSuggestion(
  spreadsheetId: string,
  userId: string,
  sheetId: string,
  cellKey: string,
  oldValue: string | null,
  newValue: string | null,
  oldFormula: string | null,
  newFormula: string | null,
): Promise<SuggestionWithAuthor> {
  await verifyAccess(spreadsheetId, userId);

  const suggestion = await prisma.suggestion.create({
    data: {
      spreadsheetId,
      sheetId,
      cellKey,
      oldValue,
      newValue,
      oldFormula,
      newFormula,
      authorId: userId,
      status: "pending",
    },
    select: SUGGESTION_SELECT,
  });

  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  logger.info(
    { spreadsheetId, sheetId, cellKey, userId },
    "Suggestion created",
  );

  return {
    ...suggestion,
    author: author ?? { id: userId, name: null, email: "" },
  };
}

export async function reviewSuggestion(
  spreadsheetId: string,
  userId: string,
  suggestionId: string,
  action: "accepted" | "rejected",
): Promise<SuggestionWithAuthor> {
  await verifyAccess(spreadsheetId, userId);

  const existing = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    select: { spreadsheetId: true, status: true, authorId: true },
  });

  if (!existing || existing.spreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Suggestion not found");
  }
  if (existing.status !== "pending") {
    throw new ForbiddenError("Suggestion already reviewed");
  }

  const suggestion = await prisma.suggestion.update({
    where: { id: suggestionId },
    data: {
      status: action,
      reviewedById: userId,
      reviewedAt: new Date(),
    },
    select: SUGGESTION_SELECT,
  });

  const author = await prisma.user.findUnique({
    where: { id: suggestion.authorId },
    select: { id: true, name: true, email: true },
  });

  logger.info(
    { spreadsheetId, suggestionId, action, userId },
    "Suggestion reviewed",
  );

  return {
    ...suggestion,
    author: author ?? { id: suggestion.authorId, name: null, email: "" },
  };
}

export async function bulkReview(
  spreadsheetId: string,
  userId: string,
  action: "accepted" | "rejected",
): Promise<number> {
  await verifyAccess(spreadsheetId, userId);

  const result = await prisma.suggestion.updateMany({
    where: {
      spreadsheetId,
      status: "pending",
    },
    data: {
      status: action,
      reviewedById: userId,
      reviewedAt: new Date(),
    },
  });

  logger.info(
    { spreadsheetId, action, userId, count: result.count },
    "Bulk suggestion review",
  );

  return result.count;
}
