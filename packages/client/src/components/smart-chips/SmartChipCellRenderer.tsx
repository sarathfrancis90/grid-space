import React from "react";
import type { SmartChip } from "../../types/grid";
import { SmartChipDisplay } from "./SmartChipDisplay";

interface SmartChipCellRendererProps {
  chips: SmartChip[];
  cellValue?: string | number | boolean | null;
  onClick?: (chip: SmartChip) => void;
}

export const SmartChipCellRenderer = React.memo(function SmartChipCellRenderer({
  chips,
  cellValue,
  onClick,
}: SmartChipCellRendererProps) {
  if (chips.length === 0 && cellValue == null) return null;

  return (
    <div
      data-testid="smart-chip-cell-content"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexWrap: "wrap",
        overflow: "hidden",
        height: "100%",
        padding: "2px 4px",
      }}
    >
      {cellValue != null && String(cellValue) !== "" && (
        <span>{String(cellValue)}</span>
      )}
      {chips.map((chip) => (
        <SmartChipDisplay key={chip.id} chip={chip} onClick={onClick} />
      ))}
    </div>
  );
});
