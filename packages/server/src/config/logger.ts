import pino from "pino";

/**
 * Create a configured Pino logger instance.
 * - Production: JSON output to stdout (for log aggregation)
 * - Development: pretty-printed human-readable output
 * - Test: silent by default
 */
export function createLogger(nodeEnv?: string, logLevel?: string): pino.Logger {
  const environment = nodeEnv ?? process.env.NODE_ENV ?? "development";
  const isDev = environment === "development";
  const isTest = environment === "test";

  const level = logLevel || (isTest ? "silent" : isDev ? "debug" : "info");

  const baseOptions: pino.LoggerOptions = {
    level,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "passwordHash",
        "token",
        "refreshToken",
      ],
      censor: "[REDACTED]",
    },
  };

  if (isDev) {
    return pino({
      ...baseOptions,
      transport: {
        target: "pino/file",
        options: { destination: 1 },
      },
    });
  }

  // Production/staging: plain JSON to stdout for log aggregation
  return pino(baseOptions);
}
