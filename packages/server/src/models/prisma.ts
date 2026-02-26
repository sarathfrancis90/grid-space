import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

/**
 * Prisma Client singleton.
 *
 * Connection pooling is controlled via DATABASE_URL query params:
 *   ?connection_limit=10   — max connections in pool (default: num_cpus * 2 + 1)
 *   ?pool_timeout=10       — seconds to wait for a connection before erroring
 *
 * Recommended pool sizes:
 *   Development:  5
 *   Staging:     10
 *   Production:  20  (scale with available DB connections / app instances)
 */
const prisma = new PrismaClient({
  log: [
    { level: "error", emit: "event" },
    { level: "warn", emit: "event" },
  ],
});

prisma.$on("error", (e) => {
  logger.error({ target: e.target, message: e.message }, "Prisma error");
});

prisma.$on("warn", (e) => {
  logger.warn({ target: e.target, message: e.message }, "Prisma warning");
});

export default prisma;
