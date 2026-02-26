import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface CommentWithReplies {
  id: string;
  spreadsheetId: string;
  sheetId: string;
  cellKey: string;
  text: string;
  resolved: boolean;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  replies: Array<{
    id: string;
    text: string;
    mentions: string[];
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

const COMMENT_SELECT = {
  id: true,
  spreadsheetId: true,
  sheetId: true,
  cellKey: true,
  text: true,
  resolved: true,
  mentions: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  replies: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      text: true,
      mentions: true,
      createdAt: true,
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  },
};

/** Check if user has at least viewer access to the spreadsheet */
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

/** Parse @mentions from comment text — returns array of email strings */
export function parseMentions(text: string): string[] {
  const mentionRegex = /@([\w.+-]+@[\w.-]+\.\w+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

/** List all comments for a spreadsheet */
export async function listComments(
  spreadsheetId: string,
  userId: string,
  sheetId?: string,
): Promise<CommentWithReplies[]> {
  await checkAccess(spreadsheetId, userId);

  const where: Record<string, unknown> = { spreadsheetId };
  if (sheetId) where.sheetId = sheetId;

  const comments = await prisma.comment.findMany({
    where,
    select: COMMENT_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return comments;
}

/** Add a comment */
export async function addComment(
  spreadsheetId: string,
  userId: string,
  sheetId: string,
  cellKey: string,
  text: string,
): Promise<CommentWithReplies> {
  await checkAccess(spreadsheetId, userId);

  const mentions = parseMentions(text);

  const comment = await prisma.comment.create({
    data: {
      spreadsheetId,
      authorId: userId,
      sheetId,
      cellKey,
      text,
      mentions,
    },
    select: COMMENT_SELECT,
  });

  logger.info(
    { userId, spreadsheetId, commentId: comment.id },
    "Comment added",
  );

  return comment;
}

/** Edit a comment (only author can edit) */
export async function editComment(
  spreadsheetId: string,
  userId: string,
  commentId: string,
  text: string,
): Promise<CommentWithReplies> {
  await checkAccess(spreadsheetId, userId);

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, spreadsheetId: true },
  });

  if (!existing || existing.spreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  if (existing.authorId !== userId) {
    throw new ForbiddenError("You can only edit your own comments");
  }

  const mentions = parseMentions(text);

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { text, mentions },
    select: COMMENT_SELECT,
  });

  return comment;
}

/** Delete a comment (only author or spreadsheet owner) */
export async function deleteComment(
  spreadsheetId: string,
  userId: string,
  commentId: string,
): Promise<void> {
  const role = await checkAccess(spreadsheetId, userId);

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, spreadsheetId: true },
  });

  if (!existing || existing.spreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  if (existing.authorId !== userId && role !== "owner") {
    throw new ForbiddenError("You can only delete your own comments");
  }

  await prisma.comment.delete({ where: { id: commentId } });

  logger.info({ userId, spreadsheetId, commentId }, "Comment deleted");
}

/** Resolve a comment thread */
export async function resolveComment(
  spreadsheetId: string,
  userId: string,
  commentId: string,
): Promise<CommentWithReplies> {
  await checkAccess(spreadsheetId, userId);

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { spreadsheetId: true },
  });

  if (!existing || existing.spreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { resolved: true },
    select: COMMENT_SELECT,
  });

  return comment;
}

/** Unresolve a comment thread */
export async function unresolveComment(
  spreadsheetId: string,
  userId: string,
  commentId: string,
): Promise<CommentWithReplies> {
  await checkAccess(spreadsheetId, userId);

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { spreadsheetId: true },
  });

  if (!existing || existing.spreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { resolved: false },
    select: COMMENT_SELECT,
  });

  return comment;
}

/** Add a reply to a comment thread */
export async function addReply(
  spreadsheetId: string,
  userId: string,
  commentId: string,
  text: string,
): Promise<CommentWithReplies> {
  await checkAccess(spreadsheetId, userId);

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { spreadsheetId: true },
  });

  if (!existing || existing.spreadsheetId !== spreadsheetId) {
    throw new NotFoundError("Comment not found");
  }

  const mentions = parseMentions(text);

  await prisma.commentReply.create({
    data: {
      commentId,
      authorId: userId,
      text,
      mentions,
    },
  });

  // Return updated comment with all replies
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: COMMENT_SELECT,
  });

  logger.info({ userId, spreadsheetId, commentId }, "Reply added to comment");

  return comment!;
}
