import type { Server, Socket } from "socket.io";
import { WS_EVENTS } from "./types";
import type {
  JoinPayload,
  CursorMovePayload,
  CellEditStartPayload,
  CellEditEndPayload,
  CellUpdatePayload,
  SheetSwitchPayload,
  SheetAddPayload,
  SheetDeletePayload,
  SheetRenamePayload,
  StructureChangePayload,
  FormatUpdatePayload,
  ChartUpdatePayload,
  TypingPayload,
  SocketData,
} from "./types";
import * as presence from "./presence";
import * as cellLocks from "./cellLocks";
import { checkRateLimit, removeClient } from "./rateLimit";
import logger from "../utils/logger";
import prisma from "../models/prisma";

function roomName(spreadsheetId: string): string {
  return `spreadsheet:${spreadsheetId}`;
}

async function verifySpreadsheetAccess(
  userId: string,
  spreadsheetId: string,
): Promise<boolean> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
      shareLinkRole: true,
    },
  });

  if (!spreadsheet) return false;
  if (spreadsheet.ownerId === userId) return true;
  if (spreadsheet.access.length > 0) return true;
  return false;
}

export function registerHandlers(io: Server, socket: Socket): void {
  const data = socket.data as SocketData;
  const userId = data.user.id;

  // ─── Rate limit wrapper ─────────────────────────────────
  function withRateLimit(handler: (...args: unknown[]) => void) {
    return (...args: unknown[]) => {
      if (!checkRateLimit(socket.id)) {
        socket.emit(WS_EVENTS.CONNECTION_ERROR, "Rate limit exceeded");
        return;
      }
      handler(...args);
    };
  }

  // ─── JOIN / LEAVE ───────────────────────────────────────
  socket.on(
    WS_EVENTS.JOIN_SPREADSHEET,
    withRateLimit(async (payload: unknown) => {
      const { spreadsheetId, sheetId, tabId } = payload as JoinPayload;

      const hasAccess = await verifySpreadsheetAccess(userId, spreadsheetId);
      if (!hasAccess) {
        socket.emit(WS_EVENTS.CONNECTION_ERROR, "Access denied");
        return;
      }

      // Leave previous room if any
      if (data.spreadsheetId) {
        await handleLeave(socket, io);
      }

      data.spreadsheetId = spreadsheetId;
      data.tabId = tabId;
      const room = roomName(spreadsheetId);
      await socket.join(room);

      const user = presence.addUser(
        spreadsheetId,
        userId,
        data.user.name ?? "Anonymous",
        data.user.avatarUrl,
        sheetId,
        tabId,
      );

      // Send current presence list to joining user
      const users = presence.getUsers(spreadsheetId);
      socket.emit(WS_EVENTS.PRESENCE_LIST, users);

      // Send current locked cells
      const lockedCells = cellLocks.getLockedCells(spreadsheetId);
      socket.emit("locked-cells", lockedCells);

      // Broadcast join to others
      socket.to(room).emit(WS_EVENTS.USER_JOINED, user);

      logger.debug({ userId, spreadsheetId, tabId }, "User joined spreadsheet");
    }),
  );

  socket.on(WS_EVENTS.LEAVE_SPREADSHEET, async () => {
    await handleLeave(socket, io);
  });

  // ─── CURSORS ────────────────────────────────────────────
  socket.on(
    WS_EVENTS.CURSOR_MOVE,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId, cell, range } =
        payload as CursorMovePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      presence.updateCursor(spreadsheetId, userId, data.tabId, cell, range);

      socket.to(roomName(spreadsheetId)).emit(WS_EVENTS.CURSOR_UPDATE, {
        userId,
        sheetId,
        cell,
        range,
        tabId: data.tabId,
      });
    }),
  );

  // ─── CELL EDITING ───────────────────────────────────────
  socket.on(
    WS_EVENTS.CELL_EDIT_START,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId, cell } = payload as CellEditStartPayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      const locked = cellLocks.lockCell(
        spreadsheetId,
        sheetId,
        cell,
        userId,
        data.tabId,
      );
      if (!locked) return;

      socket.to(roomName(spreadsheetId)).emit(WS_EVENTS.CELL_LOCKED, {
        sheetId,
        cell,
        userId,
      });
    }),
  );

  socket.on(
    WS_EVENTS.CELL_EDIT_END,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId, cell } = payload as CellEditEndPayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      cellLocks.unlockCell(spreadsheetId, sheetId, cell, userId);

      socket.to(roomName(spreadsheetId)).emit(WS_EVENTS.CELL_UNLOCKED, {
        sheetId,
        cell,
      });
    }),
  );

  socket.on(
    WS_EVENTS.CELL_UPDATE,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId, cell, value, formula } =
        payload as CellUpdatePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      socket.to(roomName(spreadsheetId)).emit(WS_EVENTS.CELL_REMOTE_UPDATE, {
        userId,
        sheetId,
        cell,
        value,
        formula,
      });
    }),
  );

  // ─── TYPING INDICATOR ──────────────────────────────────
  socket.on(
    WS_EVENTS.TYPING_START,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId, cell } = payload as TypingPayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      socket.to(roomName(spreadsheetId)).emit(WS_EVENTS.TYPING_INDICATOR, {
        userId,
        sheetId,
        cell,
        typing: true,
      });
    }),
  );

  socket.on(
    WS_EVENTS.TYPING_END,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId, cell } = payload as TypingPayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      socket.to(roomName(spreadsheetId)).emit(WS_EVENTS.TYPING_INDICATOR, {
        userId,
        sheetId,
        cell,
        typing: false,
      });
    }),
  );

  // ─── SHEET SYNC ─────────────────────────────────────────
  socket.on(
    WS_EVENTS.SHEET_SWITCH,
    withRateLimit((payload: unknown) => {
      const { spreadsheetId, sheetId } = payload as SheetSwitchPayload;
      if (!data.spreadsheetId || data.spreadsheetId !== spreadsheetId) return;

      presence.updateActiveSheet(spreadsheetId, userId, data.tabId, sheetId);

      socket
        .to(roomName(spreadsheetId))
        .emit(WS_EVENTS.SHEET_SWITCH_BROADCAST, {
          userId,
          sheetId,
        });
    }),
  );

  socket.on(
    WS_EVENTS.SHEET_ADD,
    withRateLimit((payload: unknown) => {
      const p = payload as SheetAddPayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.SHEET_SYNC, {
        type: "add",
        ...p,
        userId,
      });
    }),
  );

  socket.on(
    WS_EVENTS.SHEET_DELETE,
    withRateLimit((payload: unknown) => {
      const p = payload as SheetDeletePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.SHEET_SYNC, {
        type: "delete",
        ...p,
        userId,
      });
    }),
  );

  socket.on(
    WS_EVENTS.SHEET_RENAME,
    withRateLimit((payload: unknown) => {
      const p = payload as SheetRenamePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.SHEET_SYNC, {
        type: "rename",
        ...p,
        userId,
      });
    }),
  );

  // ─── STRUCTURAL CHANGES ─────────────────────────────────
  socket.on(
    WS_EVENTS.ROW_INSERT,
    withRateLimit((payload: unknown) => {
      const p = payload as StructureChangePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.STRUCTURE_SYNC, {
        ...p,
        userId,
      });
    }),
  );

  socket.on(
    WS_EVENTS.ROW_DELETE,
    withRateLimit((payload: unknown) => {
      const p = payload as StructureChangePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.STRUCTURE_SYNC, {
        ...p,
        userId,
      });
    }),
  );

  socket.on(
    WS_EVENTS.COL_INSERT,
    withRateLimit((payload: unknown) => {
      const p = payload as StructureChangePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.STRUCTURE_SYNC, {
        ...p,
        userId,
      });
    }),
  );

  socket.on(
    WS_EVENTS.COL_DELETE,
    withRateLimit((payload: unknown) => {
      const p = payload as StructureChangePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.STRUCTURE_SYNC, {
        ...p,
        userId,
      });
    }),
  );

  // ─── FORMAT SYNC ────────────────────────────────────────
  socket.on(
    WS_EVENTS.FORMAT_UPDATE,
    withRateLimit((payload: unknown) => {
      const p = payload as FormatUpdatePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.FORMAT_SYNC, {
        ...p,
        userId,
      });
    }),
  );

  // ─── CHART SYNC ─────────────────────────────────────────
  socket.on(
    WS_EVENTS.CHART_UPDATE,
    withRateLimit((payload: unknown) => {
      const p = payload as ChartUpdatePayload;
      if (!data.spreadsheetId || data.spreadsheetId !== p.spreadsheetId) return;

      socket.to(roomName(p.spreadsheetId)).emit(WS_EVENTS.CHART_SYNC, {
        ...p,
        userId,
      });
    }),
  );

  // ─── Yjs SYNC ──────────────────────────────────────────
  socket.on(WS_EVENTS.YJS_SYNC, (data_: unknown) => {
    if (!data.spreadsheetId) return;
    socket.to(roomName(data.spreadsheetId)).emit(WS_EVENTS.YJS_SYNC, data_);
  });

  socket.on(WS_EVENTS.YJS_UPDATE, (update: unknown) => {
    if (!data.spreadsheetId) return;
    socket.to(roomName(data.spreadsheetId)).emit(WS_EVENTS.YJS_UPDATE, update);
  });

  // ─── DISCONNECT ─────────────────────────────────────────
  socket.on("disconnect", async () => {
    await handleLeave(socket, io);
    removeClient(socket.id);
  });
}

async function handleLeave(socket: Socket, io: Server): Promise<void> {
  const data = socket.data as SocketData;
  const spreadsheetId = data.spreadsheetId;
  if (!spreadsheetId) return;

  const userId = data.user.id;
  const tabId = data.tabId;
  const room = roomName(spreadsheetId);

  // Remove presence
  const removedUser = presence.removeUser(spreadsheetId, userId, tabId);

  // Unlock all cells held by this user+tab
  const unlockedCells = cellLocks.unlockAllForUser(
    spreadsheetId,
    userId,
    tabId,
  );
  for (const cellKey of unlockedCells) {
    const [sheetId, cell] = cellKey.split(":");
    io.to(room).emit(WS_EVENTS.CELL_UNLOCKED, { sheetId, cell });
  }

  // Broadcast leave
  if (removedUser) {
    socket.to(room).emit(WS_EVENTS.USER_LEFT, {
      userId,
      tabId,
    });
  }

  await socket.leave(room);
  data.spreadsheetId = null;

  logger.debug({ userId, spreadsheetId, tabId }, "User left spreadsheet");
}
