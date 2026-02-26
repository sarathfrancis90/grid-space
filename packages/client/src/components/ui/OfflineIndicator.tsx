/**
 * S16-023: Offline indicator banner.
 * Shows "Offline" banner when navigator.onLine is false or WebSocket disconnects.
 * Uses both offlineStore and realtimeStore for status.
 */
import { useEffect } from "react";
import { useOfflineStore } from "../../stores/offlineStore";
import { useRealtimeStore } from "../../stores/realtimeStore";

export function OfflineIndicator() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const pendingEditsCount = useOfflineStore((s) => s.pendingEditsCount);
  const syncStatus = useOfflineStore((s) => s.syncStatus);
  const setOnline = useOfflineStore((s) => s.setOnline);
  const connectionStatus = useRealtimeStore((s) => s.connectionStatus);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  const isDisconnected = !isOnline || connectionStatus === "disconnected";
  const isReconnecting = isOnline && connectionStatus === "connecting";

  if (!isDisconnected && !isReconnecting && syncStatus !== "syncing") {
    return null;
  }

  return (
    <div
      data-testid="offline-indicator"
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium ${
        isDisconnected
          ? "bg-red-600 text-white"
          : isReconnecting
            ? "bg-yellow-500 text-black"
            : "bg-blue-600 text-white"
      }`}
    >
      {isDisconnected && (
        <>
          <span
            data-testid="offline-icon"
            className="inline-block h-2 w-2 rounded-full bg-white animate-pulse"
          />
          <span data-testid="offline-text">
            Offline
            {pendingEditsCount > 0 &&
              ` — ${pendingEditsCount} pending edit${pendingEditsCount !== 1 ? "s" : ""}`}
          </span>
        </>
      )}

      {isReconnecting && (
        <>
          <span
            data-testid="reconnecting-icon"
            className="inline-block h-2 w-2 rounded-full bg-black animate-pulse"
          />
          <span data-testid="reconnecting-text">Reconnecting...</span>
        </>
      )}

      {syncStatus === "syncing" && !isDisconnected && !isReconnecting && (
        <>
          <span
            data-testid="syncing-icon"
            className="inline-block h-2 w-2 rounded-full bg-white animate-pulse"
          />
          <span data-testid="syncing-text">Syncing offline edits...</span>
        </>
      )}
    </div>
  );
}
