import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as suggestionController from "../controllers/suggestion.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

const createSuggestionSchema = {
  body: z.object({
    sheetId: z.string().min(1),
    cellKey: z.string().min(1),
    oldValue: z
      .union([z.string(), z.number(), z.boolean(), z.null()])
      .optional(),
    newValue: z
      .union([z.string(), z.number(), z.boolean(), z.null()])
      .optional(),
    oldFormula: z.string().optional(),
    newFormula: z.string().optional(),
  }),
};

const reviewSchema = {
  body: z.object({
    action: z.enum(["accepted", "rejected"]),
  }),
};

const bulkReviewSchema = {
  body: z.object({
    action: z.enum(["accepted", "rejected"]),
  }),
};

// GET /api/spreadsheets/:id/suggestions
router.get("/", suggestionController.listSuggestions);

// POST /api/spreadsheets/:id/suggestions
router.post(
  "/",
  writeLimiter,
  validate(createSuggestionSchema),
  suggestionController.createSuggestion,
);

// PATCH /api/spreadsheets/:id/suggestions/:suggestionId
router.patch(
  "/:suggestionId",
  writeLimiter,
  validate(reviewSchema),
  suggestionController.reviewSuggestion,
);

// POST /api/spreadsheets/:id/suggestions/bulk-review
router.post(
  "/bulk-review",
  writeLimiter,
  validate(bulkReviewSchema),
  suggestionController.bulkReview,
);

export default router;
