import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { AppError } from "../utils/AppError";
import { apiSuccess } from "../utils/apiResponse";
import * as reactionService from "../services/reaction.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export async function toggleReaction(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);
    const { emoji } = req.body;

    const result = await reactionService.toggleReaction(
      spreadsheetId,
      req.user.id,
      commentId,
      emoji,
    );

    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
}

export async function getReactions(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");

    const spreadsheetId = paramStr(req.params.id);
    const commentId = paramStr(req.params.commentId);

    const reactions = await reactionService.getReactions(
      spreadsheetId,
      req.user.id,
      commentId,
    );

    res.json(apiSuccess(reactions));
  } catch (err) {
    next(err);
  }
}
