import React, { useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useFormatStore } from "../../stores/formatStore";
import { useHistoryStore } from "../../stores/historyStore";
import type { CellFormat } from "../../types/grid";

type TabName = "number" | "alignment" | "font" | "border";

const NUMBER_FORMATS = [
  { label: "General", value: "" },
  { label: "Number", value: "#,##0.00" },
  { label: "Currency", value: "$#,##0.00" },
  { label: "Percent", value: "0.00%" },
  { label: "Date", value: "M/d/yyyy" },
  { label: "Time", value: "h:mm:ss AM/PM" },
  { label: "Scientific", value: "0.00E+00" },
  { label: "Text", value: "@" },
];

export const FormatCellsDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isFormatCellsDialogOpen);
  const close = useUIStore((s) => s.setFormatCellsDialogOpen);
  const [activeTab, setActiveTab] = useState<TabName>("number");
  const [format, setFormat] = useState<Partial<CellFormat>>({});

  if (!isOpen) return null;

  const handleApply = () => {
    useHistoryStore.getState().pushUndo();
    useFormatStore.getState().setFormatOnSelection(format);
    close(false);
    setFormat({});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      data-testid="format-cells-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[480px]"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "480px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="format-cells-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Format Cells
        </h2>

        {/* Tabs */}
        <div
          className="flex border-b mb-4"
          style={{
            gap: "4px",
            marginBottom: "16px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {(["number", "alignment", "font", "border"] as const).map((tab) => (
            <button
              key={tab}
              className={`px-3 py-2 text-sm capitalize ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={{ padding: "8px 12px" }}
              data-testid={`format-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Number Tab */}
        {activeTab === "number" && (
          <div data-testid="format-number-panel" className="space-y-2">
            {NUMBER_FORMATS.map((nf) => (
              <label
                key={nf.value}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="number-format"
                  checked={format.numberFormat === nf.value}
                  onChange={() =>
                    setFormat((f) => ({ ...f, numberFormat: nf.value }))
                  }
                  data-testid={`format-nf-${nf.label.toLowerCase()}`}
                />
                <span className="text-sm">{nf.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Alignment Tab */}
        {activeTab === "alignment" && (
          <div data-testid="format-alignment-panel" className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Horizontal
              </label>
              <select
                className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
                value={format.horizontalAlign ?? ""}
                onChange={(e) =>
                  setFormat((f) => ({
                    ...f,
                    horizontalAlign: (e.target.value ||
                      undefined) as CellFormat["horizontalAlign"],
                  }))
                }
                data-testid="format-halign"
              >
                <option value="">Default</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vertical</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
                value={format.verticalAlign ?? ""}
                onChange={(e) =>
                  setFormat((f) => ({
                    ...f,
                    verticalAlign: (e.target.value ||
                      undefined) as CellFormat["verticalAlign"],
                  }))
                }
                data-testid="format-valign"
              >
                <option value="">Default</option>
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Wrap Text
              </label>
              <select
                className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
                value={format.wrapText ?? ""}
                onChange={(e) =>
                  setFormat((f) => ({
                    ...f,
                    wrapText: (e.target.value ||
                      undefined) as CellFormat["wrapText"],
                  }))
                }
                data-testid="format-wrap"
              >
                <option value="">Default</option>
                <option value="overflow">Overflow</option>
                <option value="wrap">Wrap</option>
                <option value="clip">Clip</option>
              </select>
            </div>
          </div>
        )}

        {/* Font Tab */}
        {activeTab === "font" && (
          <div data-testid="format-font-panel" className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Font Size
              </label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
                value={format.fontSize ?? ""}
                onChange={(e) =>
                  setFormat((f) => ({
                    ...f,
                    fontSize: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                data-testid="format-font-size"
                min={6}
                max={72}
              />
            </div>
            <div
              className="flex gap-4"
              style={{ display: "flex", gap: "16px" }}
            >
              <label
                className="flex items-center gap-1"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <input
                  type="checkbox"
                  checked={format.bold ?? false}
                  onChange={(e) =>
                    setFormat((f) => ({ ...f, bold: e.target.checked }))
                  }
                  data-testid="format-bold"
                />
                <span className="text-sm font-bold">Bold</span>
              </label>
              <label
                className="flex items-center gap-1"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <input
                  type="checkbox"
                  checked={format.italic ?? false}
                  onChange={(e) =>
                    setFormat((f) => ({ ...f, italic: e.target.checked }))
                  }
                  data-testid="format-italic"
                />
                <span className="text-sm italic">Italic</span>
              </label>
              <label
                className="flex items-center gap-1"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <input
                  type="checkbox"
                  checked={format.underline ?? false}
                  onChange={(e) =>
                    setFormat((f) => ({ ...f, underline: e.target.checked }))
                  }
                  data-testid="format-underline"
                />
                <span className="text-sm underline">Underline</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Text Color
              </label>
              <input
                type="color"
                className="w-8 h-8 border rounded cursor-pointer"
                style={{
                  width: "32px",
                  height: "32px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
                value={format.textColor ?? "#000000"}
                onChange={(e) =>
                  setFormat((f) => ({ ...f, textColor: e.target.value }))
                }
                data-testid="format-text-color"
              />
            </div>
          </div>
        )}

        {/* Border Tab */}
        {activeTab === "border" && (
          <div
            data-testid="format-border-panel"
            className="text-sm text-gray-500"
          >
            Use the toolbar border button to set borders on selected cells.
          </div>
        )}

        <div
          className="flex justify-end gap-2 mt-6"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            data-testid="format-cells-cancel"
            onClick={() => {
              close(false);
              setFormat({});
            }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            data-testid="format-cells-apply"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
