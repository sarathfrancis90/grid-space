import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { sendEmailAttachment } from "../controllers/email.controller";
import { z } from "zod/v4";
import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

/** Tight rate limit for email sending: 5 emails per minute */
const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10000 : 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: "Too many email requests, please try again later",
    },
  },
});

const sendEmailSchema = {
  body: z.object({
    recipients: z
      .array(z.email())
      .min(1, "At least one recipient is required")
      .max(10, "Maximum 10 recipients allowed"),
    subject: z.string().min(1).max(500),
    message: z.string().max(5000).default(""),
    format: z.enum(["xlsx", "csv"]),
    spreadsheetData: z.object({
      sheets: z.array(
        z.object({
          name: z.string(),
          cells: z.record(
            z.string(),
            z.object({
              value: z
                .union([z.string(), z.number(), z.boolean(), z.null()])
                .optional(),
            }),
          ),
        }),
      ),
    }),
  }),
};

const router = Router();

router.post(
  "/",
  authenticate,
  emailLimiter,
  validate(sendEmailSchema),
  sendEmailAttachment,
);

export default router;
