import { useCallback } from "react";

interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 100,
      }}
      onMouseDown={handleBackdropClick}
      onContextMenu={handleBackdropClick}
    >
      <div
        data-testid="context-menu"
        style={{
          position: "absolute",
          left: x,
          top: y,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          minWidth: 180,
          padding: "4px 0",
          zIndex: 101,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {items.map((item, idx) =>
          item.separator ? (
            <div
              key={idx}
              style={{
                height: 1,
                background: "#e2e2e2",
                margin: "4px 0",
              }}
            />
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
              style={{
                padding: "6px 16px",
                cursor: item.disabled ? "default" : "pointer",
                color: item.disabled ? "#999" : "#333",
                fontSize: 13,
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "#e8f0fe";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              {item.label}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
