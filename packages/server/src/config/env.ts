export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3001", 10),
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://gridspace:gridspace_dev@localhost:5432/gridspace",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "dev-jwt-secret",
  COMMIT_SHA: process.env.COMMIT_SHA || "dev",
} as const;
