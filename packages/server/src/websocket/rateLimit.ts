/**
 * WebSocket message rate limiter.
 * Tracks events per client (socket ID) with a sliding window.
 * Default: 50 events per second per client.
 */

interface RateWindow {
  count: number;
  resetAt: number;
}

const windows = new Map<string, RateWindow>();

const MAX_EVENTS_PER_SECOND = 50;
const WINDOW_MS = 1000;

export function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  const window = windows.get(socketId);

  if (!window || now >= window.resetAt) {
    windows.set(socketId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  window.count++;
  return window.count <= MAX_EVENTS_PER_SECOND;
}

export function removeClient(socketId: string): void {
  windows.delete(socketId);
}

/** Clear all rate limit state — useful for testing */
export function clearAll(): void {
  windows.clear();
}
