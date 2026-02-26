import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

/** Global rate limit: 100 requests per minute (disabled in test) */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10000 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 429, message: "Too many requests, please try again later" },
  },
});

/** Auth endpoints: 5 requests per minute (disabled in test) */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10000 : 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: "Too many auth attempts, please try again later",
    },
  },
});

/** Write endpoints: 30 requests per minute (disabled in test) */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10000 : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: "Too many write requests, please try again later",
    },
  },
});
