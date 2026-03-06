import React, { useCallback } from "react";
import type { SmartChip } from "../../types/grid";

interface SmartChipDisplayProps {
  chip: SmartChip;
  isEditing?: boolean;
  onRemove?: (chipId: string) => void;
  onClick?: (chip: SmartChip) => void;
}

const CHIP_TYPE_ICONS: Record<string, string> = {
  person: "\u{1F464}",
  file: "\u{1F4C4}",
  date: "\u{1F4C5}",
  event: "\u{1F4C6}",
  place: "\u{1F4CD}",
  finance: "\u{1F4C8}",
  custom: "\u{2B50}",
};

const CHIP_TYPE_COLORS: Record<string, string> = {
  person: "#e8f0fe",
  file: "#fef7e0",
  date: "#e6f4ea",
  event: "#fce8e6",
  place: "#f3e8fd",
  finance: "#e0f7fa",
  custom: "#f1f3f4",
};

const CHIP_TEXT_COLORS: Record<string, string> = {
  person: "#1967d2",
  file: "#e37400",
  date: "#137333",
  event: "#c5221f",
  place: "#7627bb",
  finance: "#007b83",
  custom: "#3c4043",
};

function getChipSubtext(chip: SmartChip): string | null {
  switch (chip.type) {
    case "person":
      return chip.email;
    case "file":
      return chip.mimeType ?? null;
    case "date":
      return null;
    case "event":
      return chip.startDate;
    case "place":
      return chip.address ?? null;
    case "finance":
      return chip.exchange ?? null;
    case "custom":
      return null;
  }
}

export const SmartChipDisplay = React.memo(function SmartChipDisplay({
  chip,
  isEditing = false,
  onRemove,
  onClick,
}: SmartChipDisplayProps) {
  const handleClick = useCallback(() => {
    onClick?.(chip);
  }, [chip, onClick]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(chip.id);
    },
    [chip.id, onRemove],
  );

  const icon =
    chip.type === "custom" && chip.icon
      ? chip.icon
      : CHIP_TYPE_ICONS[chip.type];
  const bgColor =
    chip.type === "custom" && chip.color
      ? chip.color
      : CHIP_TYPE_COLORS[chip.type];
  const textColor = CHIP_TEXT_COLORS[chip.type];
  const subtext = getChipSubtext(chip);

  return (
    <span
      data-testid={`smart-chip-${chip.type}`}
      data-chip-id={chip.id}
      className="smart-chip-display"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={subtext ?? chip.displayText}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "1px 8px",
        borderRadius: "16px",
        backgroundColor: bgColor,
        color: textColor,
        fontSize: "12px",
        lineHeight: "20px",
        cursor: "pointer",
        maxWidth: "200px",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: "14px", flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontWeight: 500,
        }}
      >
        {chip.displayText}
      </span>
      {isEditing && onRemove && (
        <button
          data-testid={`smart-chip-remove-${chip.id}`}
          onClick={handleRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.1)",
            color: textColor,
            cursor: "pointer",
            fontSize: "10px",
            padding: 0,
            flexShrink: 0,
          }}
          aria-label={`Remove ${chip.displayText}`}
        >
          \u2715
        </button>
      )}
    </span>
  );
});
