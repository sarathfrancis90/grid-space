import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
}

async function checkAccess(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!ss) throw new NotFoundError("Spreadsheet not found");
  if (ss.ownerId === userId) return;
  if (ss.access.length === 0) throw new ForbiddenError("Access denied");
}

async function getCommentSpreadsheetId(commentId: string): Promise<string> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { spreadsheetId: true },
  });
  if (!comment) throw new NotFoundError("Comment not found");
  return comment.spreadsheetId;
}

function aggregateReactions(
  reactions: Array<{ emoji: string; userId: string }>,
): ReactionSummary[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.push(r.userId);
    } else {
      map.set(r.emoji, [r.userId]);
    }
  }
  const result: ReactionSummary[] = [];
  for (const [emoji, userIds] of map) {
    result.push({ emoji, count: userIds.length, userIds });
  }
  return result;
}

export async function toggleReaction(
  spreadsheetId: string,
  userId: string,
  commentId: string,
  emoji: string,
): Promise<{ added: boolean; reactions: ReactionSummary[] }> {
  const actualSpreadsheetId = await getCommentSpreadsheetId(commentId);
  if (actualSpreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  await checkAccess(spreadsheetId, userId);

  const existing = await prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: { commentId, userId, emoji },
    },
  });

  let added: boolean;
  if (existing) {
    await prisma.commentReaction.delete({ where: { id: existing.id } });
    added = false;
    logger.info({ userId, commentId, emoji }, "Reaction removed");
  } else {
    await prisma.commentReaction.create({
      data: { commentId, userId, emoji },
    });
    added = true;
    logger.info({ userId, commentId, emoji }, "Reaction added");
  }

  const allReactions = await prisma.commentReaction.findMany({
    where: { commentId },
    select: { emoji: true, userId: true },
  });

  return { added, reactions: aggregateReactions(allReactions) };
}

export async function getReactions(
  spreadsheetId: string,
  userId: string,
  commentId: string,
): Promise<ReactionSummary[]> {
  const actualSpreadsheetId = await getCommentSpreadsheetId(commentId);
  if (actualSpreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  await checkAccess(spreadsheetId, userId);

  const reactions = await prisma.commentReaction.findMany({
    where: { commentId },
    select: { emoji: true, userId: true },
  });

  return aggregateReactions(reactions);
}
