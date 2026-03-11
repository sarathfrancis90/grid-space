import { useCallback, useState } from "react";

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
  icon?: React.ReactNode;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

interface SubmenuProps {
  items: ContextMenuItem[];
  parentRect: DOMRect;
  onClose: () => void;
}

function Submenu({ items, parentRect, onClose }: SubmenuProps) {
  const left = parentRect.right;
  const top = parentRect.top;

  return (
    <div
      data-testid="context-submenu"
      className="absolute z-[102] bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-[200px]"
      style={{ left, top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) =>
        item.separator ? (
          <div key={idx} className="h-px bg-gray-100 my-1 mx-3" />
        ) : (
          <div
            key={idx}
            data-testid={`context-submenu-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
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
            <span className="flex items-center gap-2.5">
              {item.icon && (
                <span className="w-4 h-4 flex items-center justify-center text-gray-500 shrink-0">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </span>
            {item.shortcut && (
              <span className="text-gray-400 text-[11px] ml-8 font-mono">
                {item.shortcut}
              </span>
            )}
          </div>
        ),
      )}
    </div>
  );
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const [hoveredSubmenu, setHoveredSubmenu] = useState<number | null>(null);
  const [submenuParentRect, setSubmenuParentRect] = useState<DOMRect | null>(
    null,
  );

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
        className="absolute z-[101] bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-[240px]"
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
                if (!item.disabled && !item.submenu) {
                  item.action();
                  onClose();
                }
              }}
              onMouseEnter={(e) => {
                if (item.submenu) {
                  setHoveredSubmenu(idx);
                  setSubmenuParentRect(e.currentTarget.getBoundingClientRect());
                } else {
                  setHoveredSubmenu(null);
                }
              }}
              className={`flex items-center justify-between px-4 py-1.5 text-[13px] select-none transition-colors ${
                item.disabled
                  ? "text-gray-400 cursor-default"
                  : "text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {item.icon && (
                  <span className="w-4 h-4 flex items-center justify-center text-gray-500 shrink-0">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </span>
              <span className="flex items-center gap-2">
                {item.shortcut && (
                  <span className="text-gray-400 text-[11px] font-mono">
                    {item.shortcut}
                  </span>
                )}
                {item.submenu && (
                  <span className="text-gray-400 text-[10px] ml-1">▶</span>
                )}
              </span>
            </div>
          ),
        )}
      </div>
      {hoveredSubmenu !== null &&
        items[hoveredSubmenu]?.submenu &&
        submenuParentRect && (
          <Submenu
            items={items[hoveredSubmenu].submenu!}
            parentRect={submenuParentRect}
            onClose={onClose}
          />
        )}
    </div>
  );
}
