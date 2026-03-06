import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useSmartChipStore,
  SMART_CHIP_MENU_ITEMS,
} from "../../stores/smartChipStore";
import type { SmartChipType } from "../../types/grid";

interface SmartChipMenuProps {
  onSelect: (chipType: SmartChipType) => void;
  onClose: () => void;
}

export function SmartChipMenu({ onSelect, onClose }: SmartChipMenuProps) {
  const isMenuOpen = useSmartChipStore((s) => s.menu.isMenuOpen);
  const menuPosition = useSmartChipStore((s) => s.menu.menuPosition);
  const selectedIndex = useSmartChipStore((s) => s.menu.selectedIndex);
  const filterText = useSmartChipStore((s) => s.menu.filterText);
  const setMenuSelectedIndex = useSmartChipStore((s) => s.setMenuSelectedIndex);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!filterText) return SMART_CHIP_MENU_ITEMS;
    const lower = filterText.toLowerCase();
    return SMART_CHIP_MENU_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(lower),
    );
  }, [filterText]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isMenuOpen || filteredItems.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setMenuSelectedIndex(
          Math.min(selectedIndex + 1, filteredItems.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setMenuSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        onSelect(filteredItems[selectedIndex].type);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [
      isMenuOpen,
      filteredItems,
      selectedIndex,
      setMenuSelectedIndex,
      onSelect,
      onClose,
    ],
  );

  useEffect(() => {
    if (isMenuOpen) {
      window.addEventListener("keydown", handleKeyDown, true);
      return () => window.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isMenuOpen, handleKeyDown]);

  if (!isMenuOpen || filteredItems.length === 0) return null;

  return (
    <div
      ref={listRef}
      data-testid="smart-chip-menu"
      style={{
        position: "absolute",
        left: menuPosition.x,
        top: menuPosition.y + 25,
        zIndex: 50,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: 180,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "6px 8px",
          fontSize: 11,
          color: "#5f6368",
          borderBottom: "1px solid #eee",
          fontWeight: 500,
        }}
      >
        Insert Smart Chip
      </div>
      {filteredItems.map((item, idx) => (
        <div
          key={item.type}
          data-testid={`chip-menu-item-${item.type}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item.type);
          }}
          onMouseEnter={() => setMenuSelectedIndex(idx)}
          style={{
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 13,
            backgroundColor: idx === selectedIndex ? "#e8f0fe" : "white",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
