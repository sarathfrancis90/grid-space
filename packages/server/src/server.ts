import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import logger from "./utils/logger";
import { connectRedis, disconnectRedis } from "./config/redis";
import prisma from "./models/prisma";
import { createSocketServer } from "./websocket/socketServer";

async function start(): Promise<void> {
  // Connect to Redis (optional — continues without it)
  await connectRedis();

  const server = http.createServer(app);

  // Initialize WebSocket server (Socket.io)
  createSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      "GridSpace server running",
    );
  });

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    logger.info("Shutting down gracefully...");

    server.close(async () => {
      logger.info("HTTP server closed");
      await disconnectRedis();
      await prisma.$disconnect();
      logger.info("All connections closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
