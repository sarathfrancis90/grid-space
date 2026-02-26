import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as commentController from "../controllers/comment.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

const addCommentSchema = {
  body: z.object({
    sheetId: z.string().min(1),
    cellKey: z.string().min(1),
    text: z.string().min(1).max(5000),
  }),
};

const editCommentSchema = {
  body: z.object({
    text: z.string().min(1).max(5000),
  }),
};

const replySchema = {
  body: z.object({
    text: z.string().min(1).max(5000),
  }),
};

// GET /api/spreadsheets/:id/comments
router.get("/", commentController.listComments);

// POST /api/spreadsheets/:id/comments
router.post(
  "/",
  writeLimiter,
  validate(addCommentSchema),
  commentController.addComment,
);

// PUT /api/spreadsheets/:id/comments/:commentId
router.put(
  "/:commentId",
  writeLimiter,
  validate(editCommentSchema),
  commentController.editComment,
);

// DELETE /api/spreadsheets/:id/comments/:commentId
router.delete("/:commentId", writeLimiter, commentController.deleteComment);

// PUT /api/spreadsheets/:id/comments/:commentId/resolve
router.put(
  "/:commentId/resolve",
  writeLimiter,
  commentController.resolveComment,
);

// PUT /api/spreadsheets/:id/comments/:commentId/unresolve
router.put(
  "/:commentId/unresolve",
  writeLimiter,
  commentController.unresolveComment,
);

// POST /api/spreadsheets/:id/comments/:commentId/replies
router.post(
  "/:commentId/replies",
  writeLimiter,
  validate(replySchema),
  commentController.addReply,
);

export default router;
