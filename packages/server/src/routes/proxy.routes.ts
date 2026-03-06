import { Router } from "express";
import { z } from "zod/v4";
import { validate } from "../middleware/validate.middleware";
import { globalLimiter } from "../middleware/rateLimit.middleware";
import { proxyFetch } from "../controllers/proxy.controller";

const router = Router();

router.post(
  "/fetch-url",
  globalLimiter,
  validate({
    body: z.object({
      url: z.url(),
    }),
  }),
  proxyFetch,
);

export default router;
