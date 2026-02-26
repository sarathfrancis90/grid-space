import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as commentService from "../services/comment.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function listComments(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const sheetId = req.query.sheetId as string | undefined;

    const comments = await commentService.listComments(
      spreadsheetId,
      req.user.id,
      sheetId,
    );

    res.json(apiSuccess(comments));
  } catch (err) {
    next(err);
  }
}

export async function addComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const { sheetId, cellKey, text } = req.body;

    const comment = await commentService.addComment(
      spreadsheetId,
      req.user.id,
      sheetId,
      cellKey,
      text,
    );

    res.status(201).json(apiSuccess(comment));
  } catch (err) {
    next(err);
  }
}

export async function editComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);
    const { text } = req.body;

    const comment = await commentService.editComment(
      spreadsheetId,
      req.user.id,
      commentId,
      text,
    );

    res.json(apiSuccess(comment));
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);

    await commentService.deleteComment(spreadsheetId, req.user.id, commentId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function resolveComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);

    const comment = await commentService.resolveComment(
      spreadsheetId,
      req.user.id,
      commentId,
    );

    res.json(apiSuccess(comment));
  } catch (err) {
    next(err);
  }
}

export async function unresolveComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);

    const comment = await commentService.unresolveComment(
      spreadsheetId,
      req.user.id,
      commentId,
    );

    res.json(apiSuccess(comment));
  } catch (err) {
    next(err);
  }
}

export async function addReply(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);
    const { text } = req.body;

    const comment = await commentService.addReply(
      spreadsheetId,
      req.user.id,
      commentId,
      text,
    );

    res.status(201).json(apiSuccess(comment));
  } catch (err) {
    next(err);
  }
}
