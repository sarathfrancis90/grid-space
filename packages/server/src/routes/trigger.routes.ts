import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as triggerController from "../controllers/trigger.controller";

const router = Router({ mergeParams: true });

const createTriggerSchema = {
  body: z.object({
    macroId: z.string().min(1),
    eventType: z.enum(["onEdit", "onOpen", "onChange", "timeBased"]),
    intervalMinutes: z.number().int().positive().optional(),
  }),
};

const updateTriggerSchema = {
  body: z.object({
    isEnabled: z.boolean().optional(),
    intervalMinutes: z.number().int().positive().optional(),
  }),
};

// GET /api/spreadsheets/:id/triggers
router.get("/", triggerController.listTriggers);

// POST /api/spreadsheets/:id/triggers
router.post(
  "/",
  writeLimiter,
  validate(createTriggerSchema),
  triggerController.createTrigger,
);

// PATCH /api/spreadsheets/:id/triggers/:triggerId
router.patch(
  "/:triggerId",
  writeLimiter,
  validate(updateTriggerSchema),
  triggerController.updateTrigger,
);

// DELETE /api/spreadsheets/:id/triggers/:triggerId
router.delete("/:triggerId", writeLimiter, triggerController.deleteTrigger);

// GET /api/spreadsheets/:id/triggers/:triggerId/logs
router.get("/:triggerId/logs", triggerController.getTriggerLogs);

export default router;
