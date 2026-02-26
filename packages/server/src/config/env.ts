import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default(""),
  CLIENT_URL: z.string().min(1).default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COMMIT_SHA: z.string().default("dev"),
  SENTRY_DSN: z.string().default(""),
  LOG_LEVEL: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const isDev =
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test";

  // In dev/test, provide safe defaults for secrets so startup doesn't fail
  const devDefaults: Record<string, string> = isDev
    ? {
        DATABASE_URL:
          "postgresql://gridspace:gridspace_dev@localhost:5432/gridspace",
        JWT_SECRET: "dev-jwt-secret-must-be-at-least-32-chars",
        JWT_REFRESH_SECRET: "dev-jwt-refresh-secret-min-32-chars!",
      }
    : {};

  const merged = { ...devDefaults, ...process.env };

  const result = envSchema.safeParse(merged);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`Environment validation failed:\n${formatted}`);
    process.exit(1);
  }

  return result.data;
}

export const env: Env = loadEnv();
