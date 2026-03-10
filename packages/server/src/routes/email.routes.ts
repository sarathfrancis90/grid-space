import { Router } from "express";
import { z } from "zod/v4";
import { emailAsAttachment } from "../controllers/email.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { emailLimiter } from "../middleware/rateLimit.middleware";

const router = Router({ mergeParams: true });

router.use(authenticate);

const emailAttachmentSchema = {
  body: z.object({
    recipients: z
      .array(z.email())
      .min(1, "At least one recipient is required")
      .max(10, "Maximum 10 recipients allowed"),
    subject: z.string().max(200).optional(),
    message: z.string().max(2000).optional(),
    format: z.enum(["csv", "xlsx"]),
  }),
};

// POST /api/spreadsheets/:id/email — send spreadsheet as email attachment
router.post(
  "/",
  emailLimiter,
  validate(emailAttachmentSchema),
  emailAsAttachment,
);

export default router;
