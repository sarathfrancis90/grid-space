import { Router } from "express";
import { z } from "zod/v4";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { emailLimiter } from "../middleware/rateLimit.middleware";
import * as emailController from "../controllers/email.controller";

const router = Router({ mergeParams: true });

const sendEmailSchema = {
  body: z.object({
    recipients: z
      .array(z.email())
      .min(1, "At least one recipient is required")
      .max(10, "Maximum 10 recipients allowed"),
    subject: z.string().min(1, "Subject is required").max(200),
    message: z.string().max(5000).default(""),
    format: z.enum(["csv", "xlsx", "pdf"]),
    spreadsheetData: z
      .string()
      .min(1, "Spreadsheet data is required")
      .max(25 * 1024 * 1024, "Attachment data exceeds 25 MB limit"),
  }),
};

router.post(
  "/",
  authenticate,
  emailLimiter,
  validate(sendEmailSchema),
  emailController.sendEmailAttachment,
);

export default router;
