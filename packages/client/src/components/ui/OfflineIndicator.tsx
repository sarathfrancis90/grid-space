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
      className="fixed bottom-1 left-2 z-50 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] shadow-sm"
      style={{
        bottom: "4px",
        left: "8px",
        padding: "2px 10px",
        fontSize: "11px",
        backgroundColor: isDisconnected
          ? "#f3f4f6"
          : isReconnecting
            ? "#fffbeb"
            : "#eff6ff",
        color: isDisconnected
          ? "#6b7280"
          : isReconnecting
            ? "#b45309"
            : "#2563eb",
        border: `1px solid ${
          isDisconnected ? "#e5e7eb" : isReconnecting ? "#fde68a" : "#bfdbfe"
        }`,
      }}
    >
      {isDisconnected && (
        <>
          <span
            data-testid="offline-icon"
            className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
            style={{ width: "6px", height: "6px", backgroundColor: "#9ca3af" }}
          />
          <span data-testid="offline-text">
            Offline
            {pendingEditsCount > 0 && ` · ${pendingEditsCount} pending`}
          </span>
        </>
      )}

      {isReconnecting && (
        <>
          <span
            data-testid="reconnecting-icon"
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
            style={{ width: "6px", height: "6px" }}
          />
          <span data-testid="reconnecting-text">Reconnecting…</span>
        </>
      )}

      {syncStatus === "syncing" && !isDisconnected && !isReconnecting && (
        <>
          <span
            data-testid="syncing-icon"
            className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"
            style={{ width: "6px", height: "6px" }}
          />
          <span data-testid="syncing-text">Syncing…</span>
        </>
      )}
    </div>
  );
}
