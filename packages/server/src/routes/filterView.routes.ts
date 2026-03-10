import { Router } from "express";
import { z } from "zod/v4";
import {
  listFilterViews,
  createFilterView,
  updateFilterView,
  deleteFilterView,
} from "../controllers/filterView.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";

const router = Router({ mergeParams: true });

// All filter view routes require authentication
router.use(authenticate);

const createSchema = {
  body: z.object({
    name: z.string().min(1).max(200),
    criteria: z
      .array(
        z.object({
          col: z.number().int().min(0),
          allowedValues: z.array(z.string()).optional(),
          condition: z
            .object({
              op: z.string(),
              value: z.string(),
            })
            .optional(),
        }),
      )
      .default([]),
  }),
};

const updateSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    criteria: z
      .array(
        z.object({
          col: z.number().int().min(0),
          allowedValues: z.array(z.string()).optional(),
          condition: z
            .object({
              op: z.string(),
              value: z.string(),
            })
            .optional(),
        }),
      )
      .optional(),
  }),
};

// GET /api/spreadsheets/:id/sheets/:sheetId/filter-views
router.get("/", listFilterViews);

// POST /api/spreadsheets/:id/sheets/:sheetId/filter-views
router.post("/", writeLimiter, validate(createSchema), createFilterView);

// PUT /api/spreadsheets/:id/sheets/:sheetId/filter-views/:filterViewId
router.put(
  "/:filterViewId",
  writeLimiter,
  validate(updateSchema),
  updateFilterView,
);

// DELETE /api/spreadsheets/:id/sheets/:sheetId/filter-views/:filterViewId
router.delete("/:filterViewId", writeLimiter, deleteFilterView);

export default router;
