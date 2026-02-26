import React from "react";
import { useRealtimeStore } from "../../stores/realtimeStore";
import type { ConnectionStatus as Status } from "../../stores/realtimeStore";

const STATUS_CONFIG: Record<
  Status,
  { label: string; dotClass: string; textClass: string }
> = {
  connected: {
    label: "Connected",
    dotClass: "bg-green-500",
    textClass: "text-green-600",
  },
  connecting: {
    label: "Reconnecting…",
    dotClass: "bg-amber-500 animate-pulse",
    textClass: "text-amber-600",
  },
  disconnected: {
    label: "Offline",
    dotClass: "bg-gray-400",
    textClass: "text-gray-400",
  },
};

export function ConnectionStatus(): React.ReactElement {
  const status = useRealtimeStore((state) => state.connectionStatus);
  const config = STATUS_CONFIG[status];

  return (
    <div
      data-testid="connection-status"
      data-status={status}
      className={`flex items-center gap-1.5 text-xs ${config.textClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </div>
  );
}

export default ConnectionStatus;
