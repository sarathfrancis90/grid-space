import { Router } from "express";
import { z } from "zod/v4";
import { sendEmailAttachment } from "../controllers/email.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

/** Email send rate limit: 5 requests per minute to prevent spam */
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

const emailSchema = {
  body: z.object({
    recipients: z.array(z.email()).min(1).max(10),
    subject: z.string().min(1).max(500),
    message: z.string().max(5000).default(""),
    format: z.enum(["pdf", "xlsx", "csv"]),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
};

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /api/spreadsheets/:id/email — send spreadsheet as email attachment
router.post("/", emailLimiter, validate(emailSchema), sendEmailAttachment);

export default router;
