import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { writeLimiter } from "../middleware/rateLimit.middleware";
import * as notificationController from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

const preferencesSchema = {
  body: z.object({
    spreadsheetId: z.string().optional().nullable(),
    emailSharing: z.boolean().optional(),
    emailComments: z.boolean().optional(),
    emailMentions: z.boolean().optional(),
    inAppSharing: z.boolean().optional(),
    inAppComments: z.boolean().optional(),
    inAppMentions: z.boolean().optional(),
  }),
};

// GET /api/notifications
router.get("/", notificationController.listNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", notificationController.getUnreadCount);

// PUT /api/notifications/read-all
router.put("/read-all", writeLimiter, notificationController.markAllAsRead);

// PUT /api/notifications/:id/read
router.put("/:id/read", writeLimiter, notificationController.markAsRead);

// PUT /api/notifications/:id/unread
router.put("/:id/unread", writeLimiter, notificationController.markAsUnread);

// DELETE /api/notifications/:id
router.delete("/:id", writeLimiter, notificationController.deleteNotification);

// GET /api/notifications/preferences
router.get("/preferences", notificationController.getPreferences);

// PUT /api/notifications/preferences
router.put(
  "/preferences",
  writeLimiter,
  validate(preferencesSchema),
  notificationController.updatePreferences,
);

export default router;
