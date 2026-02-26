import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as templateController from "../controllers/template.controller";

const router = Router();

router.use(authenticate);

const saveAsTemplateSchema = {
  body: z.object({
    templateName: z.string().min(1).max(200),
  }),
};

// GET /api/templates
router.get("/", templateController.listTemplates);

// POST /api/templates/:templateId/create — create spreadsheet from template
router.post(
  "/:templateId/create",
  writeLimiter,
  templateController.createFromTemplate,
);

// POST /api/spreadsheets/:id/save-as-template
export const saveAsTemplateRouter = Router({ mergeParams: true });
saveAsTemplateRouter.use(authenticate);
saveAsTemplateRouter.post(
  "/",
  writeLimiter,
  validate(saveAsTemplateSchema),
  templateController.saveAsTemplate,
);

export default router;
