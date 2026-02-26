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
      data-testid="print-dialog-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-96"
        data-testid="print-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Print Settings</h2>

        {/* Orientation */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Orientation</label>
          <div className="flex gap-4">
            {(["portrait", "landscape"] as const).map((o) => (
              <label key={o} className="flex items-center gap-1 cursor-pointer">
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
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Margins</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
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
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
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
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Header</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="e.g., Page &P of &N"
            value={settings.headerText}
            onChange={(e) =>
              setSettings((s) => ({ ...s, headerText: e.target.value }))
            }
            data-testid="print-header"
          />
        </div>

        {/* Footer */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Footer</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="e.g., Confidential"
            value={settings.footerText}
            onChange={(e) =>
              setSettings((s) => ({ ...s, footerText: e.target.value }))
            }
            data-testid="print-footer"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            data-testid="print-cancel"
            onClick={() => close(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
