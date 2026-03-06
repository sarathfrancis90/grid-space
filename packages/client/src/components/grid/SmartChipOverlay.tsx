import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  useSmartChipStore,
  getChipDisplayValue,
  getChipColor,
} from "../../stores/smartChipStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useGridStore } from "../../stores/gridStore";
import { useCellStore } from "../../stores/cellStore";
import type { SmartChip, DropdownChipData } from "../../types/grid";
import { getCellKey } from "../../utils/coordinates";

interface SmartChipOverlayProps {
  visibleRange: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
}

export const SmartChipOverlay = React.memo(function SmartChipOverlay({
  visibleRange,
}: SmartChipOverlayProps) {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const sheetChips = useSmartChipStore((s) => s.chips.get(sheetId));
  const getColumnX = useGridStore((s) => s.getColumnX);
  const getRowY = useGridStore((s) => s.getRowY);
  const getColumnWidth = useGridStore((s) => s.getColumnWidth);
  const getRowHeight = useGridStore((s) => s.getRowHeight);
  const scrollLeft = useGridStore((s) => s.scrollLeft);
  const scrollTop = useGridStore((s) => s.scrollTop);
  const rowHeaderWidth = useGridStore((s) => s.rowHeaderWidth);
  const colHeaderHeight = useGridStore((s) => s.colHeaderHeight);

  if (!sheetChips || sheetChips.size === 0) return null;

  const overlays: React.ReactNode[] = [];

  for (let r = visibleRange.startRow; r <= visibleRange.endRow; r++) {
    for (let c = visibleRange.startCol; c <= visibleRange.endCol; c++) {
      const key = getCellKey(r, c);
      const chip = sheetChips.get(key);
      if (!chip) continue;

      const cellX = getColumnX(c) - scrollLeft + rowHeaderWidth;
      const cellY = getRowY(r) - scrollTop + colHeaderHeight;
      const cellH = getRowHeight(r);

      overlays.push(
        <ChipBadge
          key={key}
          chip={chip}
          x={cellX + 2}
          y={cellY + (cellH - 22) / 2}
          sheetId={sheetId}
          row={r}
          col={c}
        />,
      );
    }
  }

  return <>{overlays}</>;
});

interface ChipBadgeProps {
  chip: SmartChip;
  x: number;
  y: number;
  sheetId: string;
  row: number;
  col: number;
}

function ChipBadge({ chip, x, y, sheetId, row, col }: ChipBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const setChip = useSmartChipStore((s) => s.setChip);
  const setCell = useCellStore((s) => s.setCell);
  const getCell = useCellStore((s) => s.getCell);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const color = getChipColor(chip);
  const displayValue = getChipDisplayValue(chip);

  const handleDropdownSelect = useCallback(
    (value: string) => {
      const updatedChip: DropdownChipData = {
        ...(chip as DropdownChipData),
        value,
      };
      setChip(sheetId, row, col, updatedChip);
      const existingCell = getCell(sheetId, row, col);
      setCell(sheetId, row, col, {
        ...existingCell,
        value,
        chip: updatedChip,
      });
      setShowDropdown(false);
    },
    [chip, sheetId, row, col, setChip, setCell, getCell],
  );

  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  return (
    <div
      data-testid={`smart-chip-badge-${chip.type}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 5,
        pointerEvents: "auto",
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => {
        setShowTooltip(false);
      }}
    >
      <div
        onClick={() => {
          if (chip.type === "dropdown") {
            setShowDropdown(!showDropdown);
          }
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "1px 8px",
          borderRadius: 12,
          background: `${color}20`,
          border: `1px solid ${color}60`,
          fontSize: 12,
          color: color,
          fontWeight: 500,
          cursor: chip.type === "dropdown" ? "pointer" : "default",
          whiteSpace: "nowrap",
          lineHeight: "18px",
        }}
      >
        {chip.type === "rating" ? (
          <span style={{ fontSize: 12, letterSpacing: 1 }}>{displayValue}</span>
        ) : (
          <span>{displayValue}</span>
        )}
        {chip.type === "dropdown" && (
          <span style={{ fontSize: 8, marginLeft: 2 }}>{"\u25BC"}</span>
        )}
      </div>

      {showTooltip && !showDropdown && chip.type === "people" && (
        <div
          style={{
            position: "absolute",
            top: -36,
            left: 0,
            background: "#202124",
            color: "white",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: "nowrap",
            zIndex: 100,
          }}
        >
          {chip.email ?? chip.name}
        </div>
      )}

      {showDropdown && chip.type === "dropdown" && (
        <div
          ref={tooltipRef}
          data-testid="dropdown-chip-options"
          style={{
            position: "absolute",
            top: 24,
            left: 0,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 100,
            minWidth: 120,
          }}
        >
          {chip.options.map((option) => (
            <div
              key={option}
              data-testid={`dropdown-option-${option}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDropdownSelect(option);
              }}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
                backgroundColor: option === chip.value ? `${color}15` : "white",
                borderLeft:
                  option === chip.value
                    ? `3px solid ${color}`
                    : "3px solid transparent",
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
