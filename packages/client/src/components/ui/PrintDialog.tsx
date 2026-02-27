import React, { useState } from "react";
import { useUIStore } from "../../stores/uiStore";

type Orientation = "portrait" | "landscape";
type MarginPreset = "normal" | "narrow" | "wide";

interface PrintSettings {
  orientation: Orientation;
  margins: MarginPreset;
  showPageBreaks: boolean;
  headerText: string;
  footerText: string;
}

export const PrintDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isPrintDialogOpen);
  const close = useUIStore((s) => s.setPrintDialogOpen);

  const [settings, setSettings] = useState<PrintSettings>({
    orientation: "portrait",
    margins: "normal",
    showPageBreaks: false,
    headerText: "",
    footerText: "",
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        @page {
          size: ${settings.orientation === "landscape" ? "landscape" : "portrait"};
          margin: ${settings.margins === "narrow" ? "0.5cm" : settings.margins === "wide" ? "2.5cm" : "1.5cm"};
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
    close(false);
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
      data-testid="print-dialog-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-96"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "384px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="print-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Print Settings
        </h2>

        {/* Orientation */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <label
            className="block text-sm font-medium mb-1"
            style={{ marginBottom: "4px" }}
          >
            Orientation
          </label>
          <div className="flex gap-4" style={{ display: "flex", gap: "16px" }}>
            {(["portrait", "landscape"] as const).map((o) => (
              <label
                key={o}
                className="flex items-center gap-1 cursor-pointer"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <input
                  type="radio"
                  name="orientation"
                  checked={settings.orientation === o}
                  onChange={() =>
                    setSettings((s) => ({ ...s, orientation: o }))
                  }
                  data-testid={`print-orientation-${o}`}
                />
                <span className="capitalize text-sm">{o}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <label
            className="block text-sm font-medium mb-1"
            style={{ marginBottom: "4px" }}
          >
            Margins
          </label>
          <select
            className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              width: "100%",
            }}
            value={settings.margins}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                margins: e.target.value as MarginPreset,
              }))
            }
            data-testid="print-margins"
          >
            <option value="normal">Normal</option>
            <option value="narrow">Narrow</option>
            <option value="wide">Wide</option>
          </select>
        </div>

        {/* Page Breaks Preview */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <label
            className="flex items-center gap-2 cursor-pointer"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              type="checkbox"
              checked={settings.showPageBreaks}
              onChange={(e) =>
                setSettings((s) => ({ ...s, showPageBreaks: e.target.checked }))
              }
              data-testid="print-page-breaks"
            />
            <span className="text-sm">Show page breaks preview</span>
          </label>
        </div>

        {/* Header */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <label
            className="block text-sm font-medium mb-1"
            style={{ marginBottom: "4px" }}
          >
            Header
          </label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              width: "100%",
            }}
            placeholder="e.g., Page &P of &N"
            value={settings.headerText}
            onChange={(e) =>
              setSettings((s) => ({ ...s, headerText: e.target.value }))
            }
            data-testid="print-header"
          />
        </div>

        {/* Footer */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <label
            className="block text-sm font-medium mb-1"
            style={{ marginBottom: "4px" }}
          >
            Footer
          </label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              width: "100%",
            }}
            placeholder="e.g., Confidential"
            value={settings.footerText}
            onChange={(e) =>
              setSettings((s) => ({ ...s, footerText: e.target.value }))
            }
            data-testid="print-footer"
          />
        </div>

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
            data-testid="print-cancel"
            onClick={() => close(false)}
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
            data-testid="print-submit"
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};
