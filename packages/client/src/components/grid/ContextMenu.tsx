import { useCallback, useState, useRef, useEffect } from "react";

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

function SubMenu({
  items,
  parentRect,
  onClose,
}: {
  items: ContextMenuItem[];
  parentRect: DOMRect;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    left: parentRect.right,
    top: parentRect.top,
  });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = parentRect.right;
    let top = parentRect.top;
    if (left + rect.width > vw) {
      left = parentRect.left - rect.width;
    }
    if (top + rect.height > vh) {
      top = Math.max(4, vh - rect.height - 4);
    }
    setPosition({ left, top });
  }, [parentRect]);

  return (
    <div
      ref={menuRef}
      data-testid="context-submenu"
      className="fixed z-[102] bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-[200px]"
      style={{ left: position.left, top: position.top }}
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
            <span className="flex items-center gap-2.5">
              {item.icon && (
                <span className="w-4 h-4 flex items-center justify-center text-gray-500">
                  {item.icon}
                </span>
              )}
              {!item.icon && <span className="w-4" />}
              {item.label}
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
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw) {
      left = Math.max(4, vw - rect.width - 4);
    }
    if (top + rect.height > vh) {
      top = Math.max(4, vh - rect.height - 4);
    }
    setAdjustedPos({ left, top });
  }, [x, y]);

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
        ref={menuRef}
        data-testid="context-menu"
        className="absolute z-[101] bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-[220px]"
        style={{ left: adjustedPos.left, top: adjustedPos.top }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item, idx) =>
          item.separator ? (
            <div key={idx} className="h-px bg-gray-100 my-1 mx-3" />
          ) : (
            <div
              key={idx}
              ref={(el) => {
                if (el) itemRefs.current.set(idx, el);
              }}
              data-testid={`context-menu-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                if (!item.disabled && !item.submenu) {
                  item.action();
                  onClose();
                }
              }}
              onMouseEnter={() => {
                if (item.submenu) {
                  setHoveredSubmenu(idx);
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
                  <span className="w-4 h-4 flex items-center justify-center text-gray-500">
                    {item.icon}
                  </span>
                )}
                {!item.icon && <span className="w-4" />}
                {item.label}
              </span>
              <span className="flex items-center gap-1">
                {item.shortcut && (
                  <span className="text-gray-400 text-[11px] ml-8 font-mono">
                    {item.shortcut}
                  </span>
                )}
                {item.submenu && (
                  <span className="text-gray-400 text-[11px] ml-2">▶</span>
                )}
              </span>
              {hoveredSubmenu === idx &&
                item.submenu &&
                itemRefs.current.get(idx) && (
                  <SubMenu
                    items={item.submenu}
                    parentRect={itemRefs.current
                      .get(idx)!
                      .getBoundingClientRect()}
                    onClose={onClose}
                  />
                )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
