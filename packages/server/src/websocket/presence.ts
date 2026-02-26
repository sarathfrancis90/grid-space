import type { PresenceUser } from "./types";

/** Color palette for collaborator cursors — deterministic assignment by userId */
const COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC04",
  "#34A853",
  "#FF6D01",
  "#46BDC6",
  "#7B1FA2",
  "#C2185B",
  "#00897B",
  "#6D4C41",
  "#1565C0",
  "#2E7D32",
  "#E65100",
  "#4527A0",
  "#AD1457",
  "#00838F",
  "#558B2F",
  "#BF360C",
  "#283593",
  "#1B5E20",
];

export function assignColor(userId: string): string {
  const hash = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

/**
 * In-memory presence tracker.
 * Maps spreadsheetId → Map<compositeKey, PresenceUser>
 * compositeKey = `${userId}:${tabId}` to handle multiple tabs per user
 */
const rooms = new Map<string, Map<string, PresenceUser>>();

function getRoom(spreadsheetId: string): Map<string, PresenceUser> {
  let room = rooms.get(spreadsheetId);
  if (!room) {
    room = new Map();
    rooms.set(spreadsheetId, room);
  }
  return room;
}

function compositeKey(userId: string, tabId: string): string {
  return `${userId}:${tabId}`;
}

export function addUser(
  spreadsheetId: string,
  userId: string,
  name: string,
  avatarUrl: string | null,
  sheetId: string,
  tabId: string,
): PresenceUser {
  const room = getRoom(spreadsheetId);
  const user: PresenceUser = {
    userId,
    name: name ?? "Anonymous",
    avatarUrl,
    color: assignColor(userId),
    activeSheet: sheetId,
    cursorCell: null,
    selectionRange: null,
    tabId,
  };
  room.set(compositeKey(userId, tabId), user);
  return user;
}

export function removeUser(
  spreadsheetId: string,
  userId: string,
  tabId: string,
): PresenceUser | undefined {
  const room = rooms.get(spreadsheetId);
  if (!room) return undefined;
  const key = compositeKey(userId, tabId);
  const user = room.get(key);
  room.delete(key);
  if (room.size === 0) {
    rooms.delete(spreadsheetId);
  }
  return user;
}

export function getUsers(spreadsheetId: string): PresenceUser[] {
  const room = rooms.get(spreadsheetId);
  if (!room) return [];
  return Array.from(room.values());
}

export function updateCursor(
  spreadsheetId: string,
  userId: string,
  tabId: string,
  cell: string | null,
  range: string | null,
): void {
  const room = rooms.get(spreadsheetId);
  if (!room) return;
  const user = room.get(compositeKey(userId, tabId));
  if (user) {
    user.cursorCell = cell;
    user.selectionRange = range;
  }
}

export function updateActiveSheet(
  spreadsheetId: string,
  userId: string,
  tabId: string,
  sheetId: string,
): void {
  const room = rooms.get(spreadsheetId);
  if (!room) return;
  const user = room.get(compositeKey(userId, tabId));
  if (user) {
    user.activeSheet = sheetId;
  }
}

export function getRoomSize(spreadsheetId: string): number {
  const room = rooms.get(spreadsheetId);
  return room ? room.size : 0;
}

/** Clear all rooms — useful for testing */
export function clearAll(): void {
  rooms.clear();
}
