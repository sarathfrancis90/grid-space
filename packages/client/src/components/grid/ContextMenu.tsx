import { useCallback } from "react";

interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  return (
    <div
      data-testid="context-menu-backdrop"
      className="fixed inset-0 z-[100]"
      onMouseDown={handleBackdropClick}
      onContextMenu={handleBackdropClick}
    >
      <div
        data-testid="context-menu"
        className="absolute z-[101] bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-[220px]"
        style={{ left: x, top: y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item, idx) =>
          item.separator ? (
            <div key={idx} className="h-px bg-gray-100 my-1 mx-3" />
          ) : (
            <div
              key={idx}
              data-testid={`context-menu-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              className={`flex items-center justify-between px-4 py-1.5 text-[13px] select-none transition-colors ${
                item.disabled
                  ? "text-gray-400 cursor-default"
                  : "text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-gray-900"
              }`}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="text-gray-400 text-[11px] ml-8 font-mono">
                  {item.shortcut}
                </span>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
