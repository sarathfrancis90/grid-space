import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as notificationRuleController from "../controllers/notificationRule.controller";

const router = Router();

router.use(authenticate);

const createRuleSchema = {
  body: z.object({
    spreadsheetId: z.string().min(1),
    triggerType: z.enum(["any_changes", "form_submit", "specific_user"]),
    specificEmail: z.string().email().optional(),
    frequency: z.enum(["immediately", "daily_digest"]).optional(),
  }),
};

const updateRuleSchema = {
  body: z.object({
    triggerType: z
      .enum(["any_changes", "form_submit", "specific_user"])
      .optional(),
    specificEmail: z.string().email().nullable().optional(),
    frequency: z.enum(["immediately", "daily_digest"]).optional(),
    isActive: z.boolean().optional(),
  }),
};

// GET /api/notification-rules?spreadsheetId=xxx
router.get("/", notificationRuleController.listRules);

// POST /api/notification-rules
router.post(
  "/",
  writeLimiter,
  validate(createRuleSchema),
  notificationRuleController.createRule,
);

// PUT /api/notification-rules/:id
router.put(
  "/:id",
  writeLimiter,
  validate(updateRuleSchema),
  notificationRuleController.updateRule,
);

// DELETE /api/notification-rules/:id
router.delete("/:id", writeLimiter, notificationRuleController.deleteRule);

export default router;
