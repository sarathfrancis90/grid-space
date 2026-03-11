import React, { useState, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { colToLetter } from "../../utils/coordinates";

type Orientation = "portrait" | "landscape";
type MarginPreset = "normal" | "narrow" | "wide";
type PageSize = "letter" | "a4" | "legal" | "tabloid";
type ScaleMode = "actual" | "fit-width" | "fit-height" | "fit-page" | "custom";
type PrintRange = "current-sheet" | "all-sheets" | "selection";

interface PrintSettings {
  orientation: Orientation;
  margins: MarginPreset;
  showPageBreaks: boolean;
  headerText: string;
  footerText: string;
  pageSize: PageSize;
  scaleMode: ScaleMode;
  customScale: number;
  showGridlines: boolean;
  showRowColHeaders: boolean;
  printRange: PrintRange;
  repeatRowsCount: number;
}

const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  letter: 'Letter (8.5" x 11")',
  a4: "A4 (210mm x 297mm)",
  legal: 'Legal (8.5" x 14")',
  tabloid: 'Tabloid (11" x 17")',
};

const PAGE_SIZE_DIMS: Record<PageSize, { width: number; height: number }> = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  legal: { width: 816, height: 1344 },
  tabloid: { width: 1056, height: 1632 },
};

const MARGIN_VALUES: Record<MarginPreset, number> = {
  normal: 72,
  narrow: 36,
  wide: 108,
};

const CSS_PAGE_SIZES: Record<PageSize, string> = {
  letter: "letter",
  a4: "A4",
  legal: "legal",
  tabloid: "11in 17in",
};

function formatDisplayValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

interface PreviewData {
  rows: string[][];
  maxRow: number;
  maxCol: number;
}

function usePreviewData(sheetId: string, printRange: PrintRange): PreviewData {
  const getCell = useCellStore((s) => s.getCell);
  const getLastDataPosition = useCellStore((s) => s.getLastDataPosition);
  const selections = useUIStore((s) => s.selections);

  return useMemo(() => {
    let startRow = 0;
    let startCol = 0;
    const pos = getLastDataPosition(sheetId);
    let endRow = Math.min(pos.row, 49);
    let endCol = Math.min(pos.col, 25);

    if (printRange === "selection" && selections.length > 0) {
      const sel = selections[0];
      startRow = Math.min(sel.start.row, sel.end.row);
      startCol = Math.min(sel.start.col, sel.end.col);
      endRow = Math.max(sel.start.row, sel.end.row);
      endCol = Math.max(sel.start.col, sel.end.col);
    }

    const rows: string[][] = [];
    for (let r = startRow; r <= endRow; r++) {
      const row: string[] = [];
      for (let c = startCol; c <= endCol; c++) {
        const cell = getCell(sheetId, r, c);
        row.push(cell ? formatDisplayValue(cell.value) : "");
      }
      rows.push(row);
    }

    return { rows, maxRow: endRow - startRow, maxCol: endCol - startCol };
  }, [sheetId, printRange, selections, getCell, getLastDataPosition]);
}

const PrintPreview: React.FC<{
  settings: PrintSettings;
  sheetId: string;
}> = React.memo(({ settings, sheetId }) => {
  const { rows, maxCol } = usePreviewData(sheetId, settings.printRange);

  const dims = PAGE_SIZE_DIMS[settings.pageSize];
  const isLandscape = settings.orientation === "landscape";
  const pageW = isLandscape ? dims.height : dims.width;
  const pageH = isLandscape ? dims.width : dims.height;

  const previewScale = 200 / pageW;
  const scaledW = pageW * previewScale;
  const scaledH = pageH * previewScale;
  const margin = MARGIN_VALUES[settings.margins] * previewScale;

  const contentW = scaledW - margin * 2;
  const contentH = scaledH - margin * 2;

  const colCount = maxCol + 1 + (settings.showRowColHeaders ? 1 : 0);
  const cellW = colCount > 0 ? contentW / colCount : 0;
  const baseCellH = 10;

  return (
    <div
      data-testid="print-preview"
      style={{
        width: `${scaledW}px`,
        height: `${scaledH}px`,
        backgroundColor: "white",
        border: "1px solid #d1d5db",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: `${margin}px`,
          left: `${margin}px`,
          width: `${contentW}px`,
          height: `${contentH}px`,
          overflow: "hidden",
          fontSize: "5px",
          lineHeight: "1.2",
        }}
      >
        {settings.showRowColHeaders && (
          <div style={{ display: "flex", height: `${baseCellH}px` }}>
            <div
              style={{
                width: `${cellW}px`,
                height: `${baseCellH}px`,
                backgroundColor: "#f3f4f6",
              }}
            />
            {Array.from({ length: maxCol + 1 }, (_, c) => (
              <div
                key={c}
                style={{
                  width: `${cellW}px`,
                  height: `${baseCellH}px`,
                  backgroundColor: "#f3f4f6",
                  textAlign: "center",
                  borderBottom: "0.5px solid #d1d5db",
                  borderRight: "0.5px solid #d1d5db",
                  fontSize: "4px",
                }}
              >
                {colToLetter(c)}
              </div>
            ))}
          </div>
        )}
        {rows.slice(0, Math.floor(contentH / baseCellH)).map((row, ri) => (
          <div key={ri} style={{ display: "flex", height: `${baseCellH}px` }}>
            {settings.showRowColHeaders && (
              <div
                style={{
                  width: `${cellW}px`,
                  height: `${baseCellH}px`,
                  backgroundColor: "#f3f4f6",
                  textAlign: "center",
                  borderBottom: "0.5px solid #d1d5db",
                  borderRight: "0.5px solid #d1d5db",
                  fontSize: "4px",
                }}
              >
                {ri + 1}
              </div>
            )}
            {row.map((val, ci) => (
              <div
                key={ci}
                style={{
                  width: `${cellW}px`,
                  height: `${baseCellH}px`,
                  borderBottom: settings.showGridlines
                    ? "0.5px solid #e5e7eb"
                    : "none",
                  borderRight: settings.showGridlines
                    ? "0.5px solid #e5e7eb"
                    : "none",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  padding: "0 1px",
                }}
              >
                {val}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

PrintPreview.displayName = "PrintPreview";

export const PrintDialog: React.FC = () => {
  const isOpen = useUIStore((s) => s.isPrintDialogOpen);
  const close = useUIStore((s) => s.setPrintDialogOpen);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [settings, setSettings] = useState<PrintSettings>({
    orientation: "portrait",
    margins: "normal",
    showPageBreaks: false,
    headerText: "",
    footerText: "",
    pageSize: "letter",
    scaleMode: "actual",
    customScale: 100,
    showGridlines: true,
    showRowColHeaders: false,
    printRange: "current-sheet",
    repeatRowsCount: 0,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    const cssPageSize = CSS_PAGE_SIZES[settings.pageSize];
    const marginCss =
      settings.margins === "narrow"
        ? "0.5cm"
        : settings.margins === "wide"
          ? "2.5cm"
          : "1.5cm";

    let scaleTransform = "";
    if (settings.scaleMode === "custom") {
      scaleTransform = `body { transform: scale(${settings.customScale / 100}); transform-origin: top left; }`;
    } else if (settings.scaleMode === "fit-width") {
      scaleTransform = `body { width: 100%; overflow-x: hidden; }`;
    } else if (settings.scaleMode === "fit-page") {
      scaleTransform = `body { width: 100%; height: 100vh; overflow: hidden; }`;
    }

    const gridlineCss = settings.showGridlines
      ? "td, th { border: 1px solid #ccc; }"
      : "td, th { border: none; }";

    const style = document.createElement("style");
    style.textContent = `
      @media print {
        @page {
          size: ${cssPageSize} ${settings.orientation};
          margin: ${marginCss};
        }
        ${scaleTransform}
        ${gridlineCss}
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

  const selectStyle = {
    padding: "4px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    width: "100%",
    fontSize: "13px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500 as const,
    marginBottom: "4px",
    color: "#374151",
  };

  const sectionStyle = { marginBottom: "12px" };

  return (
    <div
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
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "660px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          display: "flex",
          gap: "24px",
        }}
        data-testid="print-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Settings */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            Print Settings
          </h2>

          {/* Print Range */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Print Range</label>
            <select
              style={selectStyle}
              value={settings.printRange}
              onChange={(e) =>
                update("printRange", e.target.value as PrintRange)
              }
              data-testid="print-range"
            >
              <option value="current-sheet">Current Sheet</option>
              <option value="all-sheets">All Sheets</option>
              <option value="selection">Selection Only</option>
            </select>
          </div>

          {/* Page Size */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Page Size</label>
            <select
              style={selectStyle}
              value={settings.pageSize}
              onChange={(e) => update("pageSize", e.target.value as PageSize)}
              data-testid="print-page-size"
            >
              {(Object.keys(PAGE_SIZE_LABELS) as PageSize[]).map((size) => (
                <option key={size} value={size}>
                  {PAGE_SIZE_LABELS[size]}
                </option>
              ))}
            </select>
          </div>

          {/* Orientation */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Orientation</label>
            <div style={{ display: "flex", gap: "16px" }}>
              {(["portrait", "landscape"] as const).map((o) => (
                <label
                  key={o}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="orientation"
                    checked={settings.orientation === o}
                    onChange={() => update("orientation", o)}
                    data-testid={`print-orientation-${o}`}
                  />
                  <span
                    style={{ fontSize: "13px", textTransform: "capitalize" }}
                  >
                    {o}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Scale</label>
            <select
              style={selectStyle}
              value={settings.scaleMode}
              onChange={(e) => update("scaleMode", e.target.value as ScaleMode)}
              data-testid="print-scale"
            >
              <option value="actual">Actual Size (100%)</option>
              <option value="fit-width">Fit to Width</option>
              <option value="fit-height">Fit to Height</option>
              <option value="fit-page">Fit to Page</option>
              <option value="custom">Custom</option>
            </select>
            {settings.scaleMode === "custom" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "6px",
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
                  style={{
                    ...selectStyle,
                    width: "80px",
                  }}
                  data-testid="print-custom-scale"
                />
                <span style={{ fontSize: "13px", color: "#6b7280" }}>%</span>
              </div>
            )}
          </div>

          {/* Margins */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Margins</label>
            <select
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
          </div>

          {/* Checkboxes: Gridlines & Headers */}
          <div style={sectionStyle}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                marginBottom: "6px",
              }}
            >
              <input
                type="checkbox"
                checked={settings.showGridlines}
                onChange={(e) => update("showGridlines", e.target.checked)}
                data-testid="print-gridlines"
              />
              <span style={{ fontSize: "13px" }}>Show gridlines</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                marginBottom: "6px",
              }}
            >
              <input
                type="checkbox"
                checked={settings.showRowColHeaders}
                onChange={(e) => update("showRowColHeaders", e.target.checked)}
                data-testid="print-headers"
              />
              <span style={{ fontSize: "13px" }}>
                Show row and column headers
              </span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={settings.showPageBreaks}
                onChange={(e) => update("showPageBreaks", e.target.checked)}
                data-testid="print-page-breaks"
              />
              <span style={{ fontSize: "13px" }}>Show page breaks preview</span>
            </label>
          </div>

          {/* Repeat Rows */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Repeat rows at top</label>
            <input
              type="number"
              min={0}
              max={20}
              value={settings.repeatRowsCount}
              onChange={(e) =>
                update(
                  "repeatRowsCount",
                  Math.max(0, Math.min(20, Number(e.target.value))),
                )
              }
              style={selectStyle}
              placeholder="0 (none)"
              data-testid="print-repeat-rows"
            />
            {settings.repeatRowsCount > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  marginTop: "2px",
                  display: "block",
                }}
              >
                Rows 1-{settings.repeatRowsCount} will repeat on each page
              </span>
            )}
          </div>

          {/* Header/Footer */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Header</label>
            <input
              type="text"
              style={selectStyle}
              placeholder="e.g., Page &P of &N"
              value={settings.headerText}
              onChange={(e) => update("headerText", e.target.value)}
              data-testid="print-header"
            />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>Footer</label>
            <input
              type="text"
              style={selectStyle}
              placeholder="e.g., Confidential"
              value={settings.footerText}
              onChange={(e) => update("footerText", e.target.value)}
              data-testid="print-footer"
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <button
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
              data-testid="print-cancel"
              onClick={() => close(false)}
            >
              Cancel
            </button>
            <button
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
              data-testid="print-submit"
              onClick={handlePrint}
            >
              Print
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            Preview
          </span>
          <PrintPreview settings={settings} sheetId={activeSheetId} />
        </div>
      </div>
    </div>
  );
};
