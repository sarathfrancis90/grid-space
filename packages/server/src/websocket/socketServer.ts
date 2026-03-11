import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../services/auth.service";
import prisma from "../models/prisma";
import { registerHandlers } from "./handlers";
import logger from "../utils/logger";
import type { SocketData } from "./types";

let io: Server | null = null;

export function createSocketServer(httpServer: HttpServer): Server {
  // In production the frontend is served from the same origin, so we allow
  // both the explicit CLIENT_URL and same-origin connections.
  const allowedOrigins =
    env.NODE_ENV === "production" ? [env.CLIENT_URL].filter(Boolean) : true;

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    // Allow both transports so Cloud Run / reverse proxies work correctly
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6, // 1MB max message
  });

  // ─── AUTH MIDDLEWARE ──────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, avatarUrl: true },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      const socketData: SocketData = {
        user,
        tabId: (socket.handshake.auth.tabId as string) || socket.id,
        spreadsheetId: null,
      };
      socket.data = socketData;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  // ─── CONNECTION HANDLER ──────────────────────────────────
  io.on("connection", (socket) => {
    const data = socket.data as SocketData;
    logger.debug(
      { userId: data.user.id, socketId: socket.id },
      "WebSocket connected",
    );
    registerHandlers(io!, socket);
  });

  logger.info("WebSocket server initialized");
  return io;
}

export function getIO(): Server | null {
  return io;
}
