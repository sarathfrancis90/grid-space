import rateLimit from "express-rate-limit";

/** Global rate limit: 100 requests per minute */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 429, message: "Too many requests, please try again later" },
  },
});

/** Auth endpoints: 5 requests per minute */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
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

/** Write endpoints: 30 requests per minute */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
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
