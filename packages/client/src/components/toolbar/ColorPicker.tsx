/**
 * Color picker dropdown — Google Sheets style grid of preset colors.
 */
import { useState, useRef, useEffect } from "react";

const PRESET_COLORS = [
  // Row 1 - darks
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  // Row 2 - reds
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  // Row 3 - lighter
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#c9daf8",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc",
  // Row 4 - medium
  "#dd7e6b",
  "#ea9999",
  "#f9cb9c",
  "#ffe599",
  "#b6d7a8",
  "#a2c4c9",
  "#a4c2f4",
  "#9fc5e8",
  "#b4a7d6",
  "#d5a6bd",
  // Row 5 - strong
  "#cc4125",
  "#e06666",
  "#f6b26b",
  "#ffd966",
  "#93c47d",
  "#76a5af",
  "#6d9eeb",
  "#6fa8dc",
  "#8e7cc3",
  "#c27ba0",
  // Row 6 - vivid
  "#a61c00",
  "#cc0000",
  "#e69138",
  "#f1c232",
  "#6aa84f",
  "#45818e",
  "#3c78d8",
  "#3d85c6",
  "#674ea7",
  "#a64d79",
];

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  label: string;
}

export function ColorPicker({
  currentColor,
  onColorChange,
  label,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        data-testid={`color-picker-${label.toLowerCase().replace(/\s/g, "-")}`}
        className="flex items-center gap-0.5 h-6 px-1 rounded-sm hover:bg-gray-100 text-xs"
        onClick={() => setIsOpen(!isOpen)}
        title={label}
        type="button"
      >
        <span className="text-[11px]">
          {label === "Text color" ? "A" : "⬛"}
        </span>
        <span
          className="block h-0.5 w-3.5"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-[7px] text-gray-500">▼</span>
      </button>
      {isOpen && (
        <div
          data-testid={`color-picker-dropdown-${label.toLowerCase().replace(/\s/g, "-")}`}
          className="absolute z-50 top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg"
          style={{ width: "220px" }}
        >
          <div className="grid grid-cols-10 gap-0.5 mb-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className="w-5 h-5 rounded-sm border border-gray-200 hover:border-gray-500 cursor-pointer"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
                title={color}
                type="button"
                data-testid={`color-swatch-${color}`}
              />
            ))}
          </div>
          <div className="flex gap-1 items-center border-t pt-2">
            <label className="text-xs text-gray-600">Custom:</label>
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-xs"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#000000"
              data-testid="color-picker-custom-input"
            />
            <button
              className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              onClick={() => {
                if (/^#[0-9a-fA-F]{6}$/.test(customColor)) {
                  onColorChange(customColor);
                  setIsOpen(false);
                }
              }}
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
