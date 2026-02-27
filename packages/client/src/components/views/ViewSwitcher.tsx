import { useViewStore } from "../../stores/viewStore";
import type { ViewType } from "../../types/views";

interface ViewOption {
  id: ViewType;
  label: string;
  icon: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: "grid", label: "Grid", icon: "▦" },
  { id: "kanban", label: "Kanban", icon: "▥" },
  { id: "timeline", label: "Timeline", icon: "▬" },
  { id: "calendar", label: "Calendar", icon: "▨" },
];

export function ViewSwitcher() {
  const activeView = useViewStore((s) => s.activeView);
  const setActiveView = useViewStore((s) => s.setActiveView);

  return (
    <div
      className="flex items-center gap-1 border-b border-gray-200 bg-[#f8f9fa] px-3"
      style={{ padding: "4px 12px", gap: "4px" }}
      data-testid="view-switcher"
    >
      {VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setActiveView(opt.id)}
          className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors ${
            activeView === opt.id
              ? "bg-[#1a73e8] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-200"
          }`}
          style={{ padding: "4px 12px", gap: "6px", fontSize: "12px" }}
          data-testid={`view-btn-${opt.id}`}
        >
          <span className="text-sm" style={{ fontSize: "14px" }}>
            {opt.icon}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
