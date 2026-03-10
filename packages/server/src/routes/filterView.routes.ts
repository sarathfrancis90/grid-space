import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as filterViewController from "../controllers/filterView.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

const createFilterViewSchema = {
  body: z.object({
    sheetId: z.string().min(1),
    name: z.string().min(1).max(200),
    filters: z.array(z.record(z.string(), z.unknown())).default([]),
  }),
};

const updateFilterViewSchema = {
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    filters: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
};

// GET /api/spreadsheets/:id/filter-views?sheetId=xxx
router.get("/", filterViewController.listFilterViews);

// POST /api/spreadsheets/:id/filter-views
router.post(
  "/",
  writeLimiter,
  validate(createFilterViewSchema),
  filterViewController.createFilterView,
);

// PUT /api/spreadsheets/:id/filter-views/:filterViewId
router.put(
  "/:filterViewId",
  writeLimiter,
  validate(updateFilterViewSchema),
  filterViewController.updateFilterView,
);

// DELETE /api/spreadsheets/:id/filter-views/:filterViewId
router.delete(
  "/:filterViewId",
  writeLimiter,
  filterViewController.deleteFilterView,
);

export default router;
