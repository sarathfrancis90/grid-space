import { useCloudStore } from "../../stores/cloudStore";

export function SaveIndicator() {
  const saveStatus = useCloudStore((s) => s.saveStatus);

  const statusMap = {
    idle: { text: "", className: "text-transparent" },
    saving: { text: "Saving...", className: "text-gray-400" },
    saved: { text: "All changes saved", className: "text-green-600" },
    error: { text: "Save failed", className: "text-red-500" },
  };

  const status = statusMap[saveStatus];

  return (
    <span
      className={`text-xs ${status.className}`}
      data-testid="save-indicator"
      data-status={saveStatus}
    >
      {status.text}
    </span>
  );
}
