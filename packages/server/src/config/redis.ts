import Redis from "ioredis";
import { env } from "./env";
import logger from "../utils/logger";

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redis) return redis;

  if (!env.REDIS_URL) {
    logger.info("REDIS_URL not set — Redis disabled");
    return null;
  }

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 5) {
        logger.error("Redis connection failed after 5 retries");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on("connect", () => {
    logger.info("Redis connected");
  });

  redis.on("error", (err: Error) => {
    logger.error({ err: err.message }, "Redis error");
  });

  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await client.connect();
    } catch (err) {
      logger.warn("Redis connection failed — continuing without cache");
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info("Redis disconnected");
  }
}

export { redis };
