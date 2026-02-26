/**
 * In-memory cell lock tracker.
 * Maps spreadsheetId → Map<cellKey, lockInfo>
 * cellKey = `${sheetId}:${cell}` (e.g. "sheet-1:A1")
 */

interface CellLock {
  userId: string;
  tabId: string;
  lockedAt: number;
}

const locks = new Map<string, Map<string, CellLock>>();

function getLockMap(spreadsheetId: string): Map<string, CellLock> {
  let map = locks.get(spreadsheetId);
  if (!map) {
    map = new Map();
    locks.set(spreadsheetId, map);
  }
  return map;
}

function cellKey(sheetId: string, cell: string): string {
  return `${sheetId}:${cell}`;
}

export function lockCell(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
  userId: string,
  tabId: string,
): boolean {
  const map = getLockMap(spreadsheetId);
  const key = cellKey(sheetId, cell);
  const existing = map.get(key);

  // Allow re-lock by same user+tab, or if no lock exists
  if (existing && existing.userId !== userId) {
    return false;
  }

  map.set(key, { userId, tabId, lockedAt: Date.now() });
  return true;
}

export function unlockCell(
  spreadsheetId: string,
  sheetId: string,
  cell: string,
  userId: string,
): boolean {
  const map = locks.get(spreadsheetId);
  if (!map) return false;

  const key = cellKey(sheetId, cell);
  const existing = map.get(key);
  if (!existing || existing.userId !== userId) return false;

  map.delete(key);
  if (map.size === 0) locks.delete(spreadsheetId);
  return true;
}

/** Remove all locks held by a specific user+tab (on disconnect) */
export function unlockAllForUser(
  spreadsheetId: string,
  userId: string,
  tabId: string,
): string[] {
  const map = locks.get(spreadsheetId);
  if (!map) return [];

  const unlockedCells: string[] = [];
  for (const [key, lock] of map) {
    if (lock.userId === userId && lock.tabId === tabId) {
      map.delete(key);
      unlockedCells.push(key);
    }
  }

  if (map.size === 0) locks.delete(spreadsheetId);
  return unlockedCells;
}

export function getLockedCells(spreadsheetId: string): Record<string, string> {
  const map = locks.get(spreadsheetId);
  if (!map) return {};

  const result: Record<string, string> = {};
  for (const [key, lock] of map) {
    result[key] = lock.userId;
  }
  return result;
}

/** Clear all locks — useful for testing */
export function clearAll(): void {
  locks.clear();
}
