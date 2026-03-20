import { useCloudStore } from "../../stores/cloudStore";

const CloudIcon = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

export function SaveIndicator() {
  const saveStatus = useCloudStore((s) => s.saveStatus);

  const statusMap: Record<
    typeof saveStatus,
    { text: string; className: string; showIcon: boolean }
  > = {
    idle: { text: "", className: "text-transparent", showIcon: false },
    saving: { text: "Saving...", className: "text-gray-400", showIcon: true },
    saved: {
      text: "All changes saved in Drive",
      className: "text-gray-500",
      showIcon: true,
    },
    error: { text: "Save failed", className: "text-red-500", showIcon: true },
  };

  const status = statusMap[saveStatus];

  return (
    <span
      className={`flex items-center gap-1 text-xs ${status.className}`}
      style={{ gap: "4px", fontSize: "11px" }}
      data-testid="save-indicator"
      data-status={saveStatus}
    >
      {status.showIcon && <CloudIcon />}
      {status.text}
    </span>
  );
}
