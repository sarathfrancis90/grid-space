import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as notificationRuleController from "../controllers/notificationRule.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

const createRuleSchema = {
  body: z.object({
    triggerType: z.enum([
      "any_changes",
      "user_submits_form",
      "specific_user_changes",
    ]),
    triggerEmail: z.string().email().optional().nullable(),
    frequency: z.enum(["immediately", "daily_digest"]).optional(),
  }),
};

const updateRuleSchema = {
  body: z.object({
    triggerType: z
      .enum(["any_changes", "user_submits_form", "specific_user_changes"])
      .optional(),
    triggerEmail: z.string().email().optional().nullable(),
    frequency: z.enum(["immediately", "daily_digest"]).optional(),
    isActive: z.boolean().optional(),
  }),
};

// GET /api/spreadsheets/:spreadsheetId/notification-rules
router.get("/", notificationRuleController.listRules);

// POST /api/spreadsheets/:spreadsheetId/notification-rules
router.post(
  "/",
  writeLimiter,
  validate(createRuleSchema),
  notificationRuleController.createRule,
);

// PUT /api/spreadsheets/:spreadsheetId/notification-rules/:ruleId
router.put(
  "/:ruleId",
  writeLimiter,
  validate(updateRuleSchema),
  notificationRuleController.updateRule,
);

// DELETE /api/spreadsheets/:spreadsheetId/notification-rules/:ruleId
router.delete("/:ruleId", writeLimiter, notificationRuleController.deleteRule);

export default router;
