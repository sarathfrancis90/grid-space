/**
 * Webhook management routes — /api/webhooks
 */
import { Router } from "express";
import { z } from "zod/v4";
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import { apiSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as webhookService from "../services/webhook.service";

const router = Router();

// All routes require JWT auth
router.use(authenticate);

const createWebhookSchema = {
  body: z.object({
    spreadsheetId: z.string().min(1),
    url: z.url(),
    events: z
      .array(z.string().min(1))
      .min(1)
      .refine((events) => events.every((e) => webhookService.isValidEvent(e)), {
        message: `Invalid event. Valid events: ${webhookService.getValidEvents().join(", ")}`,
      }),
  }),
};

const updateWebhookSchema = {
  body: z.object({
    url: z.url().optional(),
    events: z
      .array(z.string().min(1))
      .min(1)
      .refine((events) => events.every((e) => webhookService.isValidEvent(e)), {
        message: `Invalid event. Valid events: ${webhookService.getValidEvents().join(", ")}`,
      })
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

// GET /api/webhooks — list user's webhooks
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const webhooks = await webhookService.listWebhooks(req.user.id);
    res.json(apiSuccess(webhooks));
  } catch (err) {
    next(err);
  }
});

// POST /api/webhooks — create webhook
router.post(
  "/",
  writeLimiter,
  validate(createWebhookSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Authentication required");

      const { spreadsheetId, url, events } = req.body;
      const webhook = await webhookService.createWebhook(req.user.id, {
        spreadsheetId,
        url,
        events,
      });

      res.status(201).json(apiSuccess(webhook));
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/webhooks/:webhookId — update webhook
router.put(
  "/:webhookId",
  writeLimiter,
  validate(updateWebhookSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Authentication required");
      const webhookId = req.params.webhookId as string;
      const webhook = await webhookService.updateWebhook(
        webhookId,
        req.user.id,
        req.body,
      );

      res.json(apiSuccess(webhook));
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/webhooks/:webhookId — delete webhook
router.delete(
  "/:webhookId",
  writeLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Authentication required");
      const webhookId = req.params.webhookId as string;
      await webhookService.deleteWebhook(webhookId, req.user.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/webhooks/events — list valid event types
router.get("/events", (_req: AuthRequest, res: Response) => {
  res.json(apiSuccess({ events: webhookService.getValidEvents() }));
});

export default router;
