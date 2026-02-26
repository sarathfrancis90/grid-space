export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3001", 10),
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://gridspace:gridspace_dev@localhost:5432/gridspace",
  REDIS_URL: process.env.REDIS_URL || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "dev-jwt-secret",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "dev-jwt-refresh-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  COMMIT_SHA: process.env.COMMIT_SHA || "dev",
} as const;
