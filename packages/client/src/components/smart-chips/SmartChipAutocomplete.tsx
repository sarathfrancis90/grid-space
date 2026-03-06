import React, { useCallback, useEffect, useRef } from "react";
import { useSmartChipStore } from "../../stores/smartChipStore";
import type { SmartChip } from "../../types/grid";

const CHIP_TYPE_ICONS: Record<string, string> = {
  person: "\u{1F464}",
  file: "\u{1F4C4}",
  date: "\u{1F4C5}",
  event: "\u{1F4C6}",
  place: "\u{1F4CD}",
  finance: "\u{1F4C8}",
  custom: "\u{2B50}",
};

const TYPE_LABELS: Record<string, string> = {
  person: "People",
  file: "Files",
  date: "Dates",
  event: "Events",
  place: "Places",
  finance: "Finance",
  custom: "Other",
};

interface SmartChipAutocompleteProps {
  onSelect: (chip: SmartChip) => void;
  onClose: () => void;
}

export const SmartChipAutocomplete = React.memo(function SmartChipAutocomplete({
  onSelect,
  onClose,
}: SmartChipAutocompleteProps) {
  const isOpen = useSmartChipStore((s) => s.isAutocompleteOpen);
  const suggestions = useSmartChipStore((s) => s.suggestions);
  const selectedIndex = useSmartChipStore((s) => s.selectedIndex);
  const popupPosition = useSmartChipStore((s) => s.popupPosition);
  const query = useSmartChipStore((s) => s.autocompleteQuery);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleItemClick = useCallback(
    (chip: SmartChip) => {
      onSelect(chip);
    },
    [onSelect],
  );

  if (!isOpen || !popupPosition) return null;

  return (
    <div
      ref={containerRef}
      data-testid="smart-chip-autocomplete"
      style={{
        position: "absolute",
        left: popupPosition.x,
        top: popupPosition.y,
        width: "280px",
        maxHeight: "300px",
        overflowY: "auto",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        border: "1px solid #dadce0",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          fontSize: "11px",
          color: "#5f6368",
          borderBottom: "1px solid #e8eaed",
          fontWeight: 500,
        }}
      >
        {query ? `Results for "@${query}"` : "Insert smart chip"}
      </div>
      {suggestions.length === 0 ? (
        <div
          data-testid="smart-chip-no-results"
          style={{
            padding: "16px 12px",
            textAlign: "center",
            color: "#80868b",
            fontSize: "13px",
          }}
        >
          No matching items
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "4px 0",
          }}
        >
          {suggestions.map((suggestion, index) => {
            const chip = suggestion.chip;
            const icon =
              chip.type === "custom" && chip.icon
                ? chip.icon
                : CHIP_TYPE_ICONS[chip.type];
            const isSelected = index === selectedIndex;

            return (
              <li
                key={chip.id}
                data-testid={`smart-chip-suggestion-${index}`}
                onClick={() => handleItemClick(chip)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#e8f0fe" : "transparent",
                  fontSize: "13px",
                  color: "#202124",
                }}
                onMouseEnter={() =>
                  useSmartChipStore.getState().setSelectedIndex(index)
                }
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chip.displayText}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#80868b",
                    }}
                  >
                    {TYPE_LABELS[chip.type] ?? chip.type}
                  </div>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
