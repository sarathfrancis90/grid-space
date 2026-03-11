import React, { useState, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { PrintPreview } from "./PrintPreview";

type Orientation = "portrait" | "landscape";
type MarginPreset = "normal" | "narrow" | "wide";
type PageSize = "letter" | "a4" | "legal" | "tabloid";
type ScaleMode = "actual" | "fit-width" | "fit-height" | "fit-page" | "custom";
type PrintRange = "current-sheet" | "all-sheets" | "selection";

interface PrintSettings {
  orientation: Orientation;
  margins: MarginPreset;
  pageSize: PageSize;
  scaleMode: ScaleMode;
  customScale: number;
  showGridlines: boolean;
  showHeaders: boolean;
  printRange: PrintRange;
  repeatRows: number;
  showPageBreaks: boolean;
  headerText: string;
  footerText: string;
}

const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  letter: 'Letter (8.5" × 11")',
  a4: "A4 (210mm × 297mm)",
  legal: 'Legal (8.5" × 14")',
  tabloid: 'Tabloid (11" × 17")',
};

const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  legal: { width: 816, height: 1344 },
  tabloid: { width: 1056, height: 1632 },
};

const MARGIN_VALUES: Record<MarginPreset, string> = {
  normal: "1.5cm",
  narrow: "0.5cm",
  wide: "2.5cm",
};

export const PrintDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isPrintDialogOpen);
  const close = useUIStore((s) => s.setPrintDialogOpen);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const selections = useUIStore((s) => s.selections);

  const [settings, setSettings] = useState<PrintSettings>({
    orientation: "portrait",
    margins: "normal",
    pageSize: "letter",
    scaleMode: "actual",
    customScale: 100,
    showGridlines: true,
    showHeaders: false,
    printRange: "current-sheet",
    repeatRows: 0,
    showPageBreaks: false,
    headerText: "",
    footerText: "",
  });

  const lastDataPos = useCellStore((s) => s.getLastDataPosition(activeSheetId));
  const getCell = useCellStore((s) => s.getCell);

  const previewData = useMemo(() => {
    const rows: Array<Array<string>> = [];
    const maxRow = Math.min(lastDataPos.row, 49);
    const maxCol = Math.min(lastDataPos.col, 25);
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = getCell(activeSheetId, r, c);
        row.push(cell?.value != null ? String(cell.value) : "");
      }
      rows.push(row);
    }
    return rows;
  }, [activeSheetId, lastDataPos.row, lastDataPos.col, getCell]);

  const hasSelection =
    selections.length > 0 &&
    (selections[0].start.row !== selections[0].end.row ||
      selections[0].start.col !== selections[0].end.col);

  if (!isOpen) return null;

  const pageDims = PAGE_DIMENSIONS[settings.pageSize];
  const pageWidth =
    settings.orientation === "landscape" ? pageDims.height : pageDims.width;
  const pageHeight =
    settings.orientation === "landscape" ? pageDims.width : pageDims.height;

  const scalePercent =
    settings.scaleMode === "custom" ? settings.customScale : 100;

  const handlePrint = () => {
    const sizeStr =
      settings.orientation === "landscape"
        ? `${pageHeight}px ${pageWidth}px`
        : `${pageWidth}px ${pageHeight}px`;
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        @page {
          size: ${sizeStr};
          margin: ${MARGIN_VALUES[settings.margins]};
        }
        body { transform: scale(${scalePercent / 100}); transform-origin: top left; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
    close(false);
  };

  const update = <K extends keyof PrintSettings>(
    key: K,
    value: PrintSettings[K],
  ) => {
    setSettings((s) => ({ ...s, [key]: value }));
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
        className="bg-white rounded-lg shadow-xl flex"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          display: "flex",
          maxHeight: "90vh",
          maxWidth: "90vw",
        }}
        data-testid="print-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Panel */}
        <div
          className="border-r p-4 flex flex-col items-center bg-gray-50"
          style={{
            borderRight: "1px solid #e5e7eb",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#f9fafb",
            width: "420px",
            overflow: "auto",
          }}
          data-testid="print-preview-panel"
        >
          <h3
            className="text-sm font-medium mb-3 text-gray-600"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "12px",
              color: "#4b5563",
            }}
          >
            Print Preview
          </h3>
          <PrintPreview
            data={previewData}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            showGridlines={settings.showGridlines}
            showHeaders={settings.showHeaders}
            scale={scalePercent}
          />
        </div>

        {/* Settings Panel */}
        <div
          className="p-6 overflow-y-auto"
          style={{ padding: "24px", overflowY: "auto", width: "340px" }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Print Settings
          </h2>

          {/* Print Range */}
          <SettingSection label="Print Range">
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              value={settings.printRange}
              onChange={(e) =>
                update("printRange", e.target.value as PrintRange)
              }
              data-testid="print-range"
            >
              <option value="current-sheet">Current sheet</option>
              <option value="all-sheets">All sheets</option>
              <option value="selection" disabled={!hasSelection}>
                Selection only
              </option>
            </select>
          </SettingSection>

          {/* Page Size */}
          <SettingSection label="Page Size">
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              value={settings.pageSize}
              onChange={(e) => update("pageSize", e.target.value as PageSize)}
              data-testid="print-page-size"
            >
              {Object.entries(PAGE_SIZE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </SettingSection>

          {/* Orientation */}
          <SettingSection label="Orientation">
            <div
              className="flex gap-4"
              style={{ display: "flex", gap: "16px" }}
            >
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
                    onChange={() => update("orientation", o)}
                    data-testid={`print-orientation-${o}`}
                  />
                  <span className="capitalize text-sm">{o}</span>
                </label>
              ))}
            </div>
          </SettingSection>

          {/* Scale */}
          <SettingSection label="Scale">
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              value={settings.scaleMode}
              onChange={(e) => update("scaleMode", e.target.value as ScaleMode)}
              data-testid="print-scale-mode"
            >
              <option value="actual">Actual size (100%)</option>
              <option value="fit-width">Fit to width</option>
              <option value="fit-height">Fit to height</option>
              <option value="fit-page">Fit to page</option>
              <option value="custom">Custom</option>
            </select>
            {settings.scaleMode === "custom" && (
              <div
                className="flex items-center gap-2 mt-2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={settings.customScale}
                  onChange={(e) =>
                    update(
                      "customScale",
                      Math.max(10, Math.min(200, Number(e.target.value))),
                    )
                  }
                  className="w-20 border rounded px-2 py-1 text-sm"
                  style={{
                    width: "80px",
                    padding: "4px 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                  }}
                  data-testid="print-custom-scale"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            )}
          </SettingSection>

          {/* Margins */}
          <SettingSection label="Margins">
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              value={settings.margins}
              onChange={(e) =>
                update("margins", e.target.value as MarginPreset)
              }
              data-testid="print-margins"
            >
              <option value="normal">Normal</option>
              <option value="narrow">Narrow</option>
              <option value="wide">Wide</option>
            </select>
          </SettingSection>

          {/* Checkboxes */}
          <SettingSection label="Options">
            <CheckboxOption
              label="Show gridlines"
              checked={settings.showGridlines}
              onChange={(v) => update("showGridlines", v)}
              testId="print-gridlines"
            />
            <CheckboxOption
              label="Show row & column headers"
              checked={settings.showHeaders}
              onChange={(v) => update("showHeaders", v)}
              testId="print-headers"
            />
            <CheckboxOption
              label="Show page breaks preview"
              checked={settings.showPageBreaks}
              onChange={(v) => update("showPageBreaks", v)}
              testId="print-page-breaks"
            />
          </SettingSection>

          {/* Repeat Rows */}
          <SettingSection label="Repeat Rows at Top">
            <input
              type="number"
              min={0}
              max={20}
              value={settings.repeatRows}
              onChange={(e) =>
                update(
                  "repeatRows",
                  Math.max(0, Math.min(20, Number(e.target.value))),
                )
              }
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              data-testid="print-repeat-rows"
            />
            <span
              className="text-xs text-gray-400 mt-1 block"
              style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}
            >
              {settings.repeatRows > 0
                ? `Rows 1–${settings.repeatRows} repeat on every page`
                : "No rows repeated"}
            </span>
          </SettingSection>

          {/* Header */}
          <SettingSection label="Header">
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              placeholder="e.g., Page &P of &N"
              value={settings.headerText}
              onChange={(e) => update("headerText", e.target.value)}
              data-testid="print-header"
            />
          </SettingSection>

          {/* Footer */}
          <SettingSection label="Footer">
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              style={selectStyle}
              placeholder="e.g., Confidential"
              value={settings.footerText}
              onChange={(e) => update("footerText", e.target.value)}
              data-testid="print-footer"
            />
          </SettingSection>

          {/* Action Buttons */}
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
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  width: "100%",
};

interface SettingSectionProps {
  label: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ label, children }) => (
  <div className="mb-4" style={{ marginBottom: "16px" }}>
    <label
      className="block text-sm font-medium mb-1"
      style={{ marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}
    >
      {label}
    </label>
    {children}
  </div>
);

interface CheckboxOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId: string;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({
  label,
  checked,
  onChange,
  testId,
}) => (
  <label
    className="flex items-center gap-2 cursor-pointer mb-1"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px",
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      data-testid={testId}
    />
    <span className="text-sm">{label}</span>
  </label>
);
