import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useGridStore } from "../../stores/gridStore";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useClipboardStore } from "../../stores/clipboardStore";
import { useFormatStore, evaluateColorScale } from "../../stores/formatStore";
import { useFormulaStore } from "../../stores/formulaStore";
import { useFindReplaceStore } from "../../stores/findReplaceStore";
import { useValidationStore } from "../../stores/validationStore";
import { useDataStore } from "../../stores/dataStore";
import { colToLetter, getCellKey } from "../../utils/coordinates";
import { cellId, parseCellId } from "../formula/cellUtils";
import type { CellValueGetter } from "../../types/formula";
import { generateFillValues } from "../../utils/fillHandle";
import { CellEditor } from "./CellEditor";
import { ContextMenu } from "./ContextMenu";
import type { CellData, CellPosition } from "../../types/grid";
import { formatCellValue } from "../../utils/numberFormat";

const GRID_LINE_COLOR = "#e2e2e2";
const HEADER_BG = "#f8f9fa";
const HEADER_TEXT = "#666666";
const HEADER_BORDER = "#c0c0c0";
const SELECTION_BG = "rgba(26, 115, 232, 0.1)";
const SELECTION_BORDER = "#1a73e8";
const FROZEN_LINE_COLOR = "#999999";
const CELL_FONT = "13px Arial, sans-serif";
const HEADER_FONT = "12px Arial, sans-serif";
const BUFFER_ROWS = 10;
const BUFFER_COLS = 5;
const FILL_HANDLE_SIZE = 6;
const RESIZE_HANDLE_WIDTH = 5;
const CHECKBOX_SIZE = 14;
const HYPERLINK_COLOR = "#1a73e8";
const GROUP_BTN_SIZE = 12;

type DragMode = "none" | "select" | "resize-col" | "resize-row" | "fill-handle";

interface ContextMenuState {
  x: number;
  y: number;
  target: "row" | "col" | "cell";
  targetIndex: number;
}

export function Grid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number>(0);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const dragModeRef = useRef<DragMode>("none");
  const dragStartRef = useRef<CellPosition | null>(null);
  const resizeColRef = useRef<number>(-1);
  const resizeRowRef = useRef<number>(-1);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartYRef = useRef<number>(0);
  const resizeStartSizeRef = useRef<number>(0);
  const fillHandleStartRef = useRef<CellPosition | null>(null);
  const fillHandleEndRef = useRef<CellPosition | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Use stable references to getState — do NOT assign .getState to a variable
  // as it creates new references each render, causing infinite useCallback/useEffect loops

  const setScroll = useGridStore((s) => s.setScroll);
  const setViewportSize = useGridStore((s) => s.setViewportSize);
  const setSelectedCell = useUIStore((s) => s.setSelectedCell);
  const setSelections = useUIStore((s) => s.setSelections);
  const startEditing = useUIStore((s) => s.startEditing);
  const commitEdit = useUIStore((s) => s.commitEdit);
  const cancelEdit = useUIStore((s) => s.cancelEdit);

  const getActiveSheetId = useCallback(() => {
    return useSpreadsheetStore.getState().activeSheetId;
  }, []);

  // Compute total scrollable dimensions
  const computeScrollDimensions = useCallback(() => {
    const gs = useGridStore.getState();
    let totalWidth = 0;
    for (let c = 0; c < gs.totalCols; c++) {
      if (gs.hiddenCols.has(c)) continue;
      totalWidth += gs.columnWidths.get(c) ?? gs.defaultColWidth;
    }
    let totalHeight = 0;
    for (let r = 0; r < gs.totalRows; r++) {
      if (gs.hiddenRows.has(r)) continue;
      totalHeight += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
    }
    return {
      width: totalWidth + gs.rowHeaderWidth,
      height: totalHeight + gs.colHeaderHeight,
    };
  }, []);

  // Screen coords → grid coords
  const screenToGrid = useCallback(
    (screenX: number, screenY: number): CellPosition | null => {
      const gs = useGridStore.getState();
      const x = screenX - gs.rowHeaderWidth + gs.scrollLeft;
      const y = screenY - gs.colHeaderHeight + gs.scrollTop;
      if (x < 0 || y < 0) return null;
      const col = gs.getColAtX(x);
      const row = gs.getRowAtY(y);
      return { row, col };
    },
    [],
  );

  // Check if mouse is near a column resize border
  const getResizeCol = useCallback(
    (screenX: number, screenY: number): number => {
      const gs = useGridStore.getState();
      if (screenY > gs.colHeaderHeight) return -1;
      let x = gs.rowHeaderWidth;
      for (let c = 0; c < gs.totalCols; c++) {
        if (gs.hiddenCols.has(c)) continue;
        x += gs.columnWidths.get(c) ?? gs.defaultColWidth;
        const adjustedX = x - gs.scrollLeft;
        if (Math.abs(screenX - adjustedX) < RESIZE_HANDLE_WIDTH) {
          return c;
        }
      }
      return -1;
    },
    [],
  );

  // Check if mouse is near a row resize border
  const getResizeRow = useCallback(
    (screenX: number, screenY: number): number => {
      const gs = useGridStore.getState();
      if (screenX > gs.rowHeaderWidth) return -1;
      let y = gs.colHeaderHeight;
      for (let r = 0; r < gs.totalRows; r++) {
        if (gs.hiddenRows.has(r)) continue;
        y += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
        const adjustedY = y - gs.scrollTop;
        if (Math.abs(screenY - adjustedY) < RESIZE_HANDLE_WIDTH) {
          return r;
        }
      }
      return -1;
    },
    [],
  );

  // Check if mouse is on fill handle
  const isOnFillHandle = useCallback(
    (screenX: number, screenY: number): boolean => {
      const ui = useUIStore.getState();
      if (ui.selections.length === 0 || ui.isEditing) return false;
      const gs = useGridStore.getState();
      const sel = ui.selections[ui.selections.length - 1];
      const maxRow = Math.max(sel.start.row, sel.end.row);
      const maxCol = Math.max(sel.start.col, sel.end.col);

      const handleX =
        gs.getColumnX(maxCol) +
        (gs.columnWidths.get(maxCol) ?? gs.defaultColWidth) -
        gs.scrollLeft +
        gs.rowHeaderWidth;
      const handleY =
        gs.getRowY(maxRow) +
        (gs.rowHeights.get(maxRow) ?? gs.defaultRowHeight) -
        gs.scrollTop +
        gs.colHeaderHeight;

      return (
        Math.abs(screenX - handleX) < FILL_HANDLE_SIZE &&
        Math.abs(screenY - handleY) < FILL_HANDLE_SIZE
      );
    },
    [],
  );

  // Canvas draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const gs = useGridStore.getState();
    const ui = useUIStore.getState();
    const cs = useCellStore.getState();
    const activeSheetId = getActiveSheetId();
    const sheetCells = cs.cells.get(activeSheetId);

    const width = gs.viewportWidth;
    const height = gs.viewportHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const rhw = gs.rowHeaderWidth;
    const chh = gs.colHeaderHeight;

    // Compute visible range
    let startCol = 0;
    let accX = 0;
    for (let c = 0; c < gs.totalCols; c++) {
      if (gs.hiddenCols.has(c)) continue;
      const cw = gs.columnWidths.get(c) ?? gs.defaultColWidth;
      if (accX + cw > gs.scrollLeft) {
        startCol = c;
        break;
      }
      accX += cw;
    }

    let startRow = 0;
    let accY = 0;
    for (let r = 0; r < gs.totalRows; r++) {
      if (gs.hiddenRows.has(r)) continue;
      const rh = gs.rowHeights.get(r) ?? gs.defaultRowHeight;
      if (accY + rh > gs.scrollTop) {
        startRow = r;
        break;
      }
      accY += rh;
    }

    const visStartCol = Math.max(0, startCol - BUFFER_COLS);
    const visStartRow = Math.max(0, startRow - BUFFER_ROWS);

    // Find end col/row
    let endCol = startCol;
    let tempX = accX - gs.scrollLeft + rhw;
    for (let c = startCol; c < gs.totalCols; c++) {
      if (tempX > width) break;
      if (gs.hiddenCols.has(c)) continue;
      endCol = c;
      tempX += gs.columnWidths.get(c) ?? gs.defaultColWidth;
    }
    endCol = Math.min(gs.totalCols - 1, endCol + BUFFER_COLS);

    let endRow = startRow;
    let tempY = accY - gs.scrollTop + chh;
    for (let r = startRow; r < gs.totalRows; r++) {
      if (tempY > height) break;
      if (gs.hiddenRows.has(r)) continue;
      endRow = r;
      tempY += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
    }
    endRow = Math.min(gs.totalRows - 1, endRow + BUFFER_ROWS);

    // Get validation rules and data groups for rendering
    const vs = useValidationStore.getState();
    const ds = useDataStore.getState();
    const fs = useFormatStore.getState();
    const validationRules = vs.rules.get(activeSheetId);
    const rowGroups = ds.getRowGroups(activeSheetId);
    const colGroups = ds.getColGroups(activeSheetId);
    const conditionalRules = fs.getConditionalRules(activeSheetId);

    // Build set of rows/cols hidden by collapsed groups
    const groupCollapsedRows = new Set<number>();
    for (const g of rowGroups) {
      if (g.collapsed) {
        for (let r = g.start; r <= g.end; r++) groupCollapsedRows.add(r);
      }
    }
    const groupCollapsedCols = new Set<number>();
    for (const g of colGroups) {
      if (g.collapsed) {
        for (let c = g.start; c <= g.end; c++) groupCollapsedCols.add(c);
      }
    }

    // Collect numeric values for conditional format data bars and color scales
    const condRangeStats = new Map<string, { min: number; max: number }>();
    for (const rule of conditionalRules) {
      if (
        rule.type === "colorScale" ||
        rule.condition === "dataBar" ||
        rule.condition === "iconSet"
      ) {
        const key = rule.id;
        let min = Infinity;
        let max = -Infinity;
        for (let r = rule.range.startRow; r <= rule.range.endRow; r++) {
          for (let c = rule.range.startCol; c <= rule.range.endCol; c++) {
            const cd = sheetCells?.get(`${r},${c}`);
            const num = cd?.value != null ? Number(cd.value) : NaN;
            if (!isNaN(num)) {
              if (num < min) min = num;
              if (num > max) max = num;
            }
          }
        }
        if (min !== Infinity) condRangeStats.set(key, { min, max });
      }
    }

    // Draw cell backgrounds and content
    ctx.save();
    ctx.beginPath();
    ctx.rect(rhw, chh, width - rhw, height - chh);
    ctx.clip();

    for (let r = visStartRow; r <= endRow; r++) {
      if (gs.hiddenRows.has(r) || groupCollapsedRows.has(r)) continue;
      for (let c = visStartCol; c <= endCol; c++) {
        if (gs.hiddenCols.has(c) || groupCollapsedCols.has(c)) continue;
        const cellX = gs.getColumnX(c) - gs.scrollLeft + rhw;
        const cellY = gs.getRowY(r) - gs.scrollTop + chh;
        const cellW = gs.columnWidths.get(c) ?? gs.defaultColWidth;
        const cellH = gs.rowHeights.get(r) ?? gs.defaultRowHeight;

        const cellKey = `${r},${c}`;
        const cellData = sheetCells?.get(cellKey);
        const cellValue = cellData?.value;

        // Cell background
        if (cellData?.format?.backgroundColor) {
          ctx.fillStyle = cellData.format.backgroundColor;
          ctx.fillRect(
            Math.round(cellX),
            Math.round(cellY),
            Math.round(cellW),
            Math.round(cellH),
          );
        }

        // Conditional format: color scale background
        for (const rule of conditionalRules) {
          if (rule.type !== "colorScale") continue;
          const { range: rng } = rule;
          if (
            r < rng.startRow ||
            r > rng.endRow ||
            c < rng.startCol ||
            c > rng.endCol
          )
            continue;
          const num = cellValue != null ? Number(cellValue) : NaN;
          if (isNaN(num)) continue;
          const stats = condRangeStats.get(rule.id);
          if (!stats) continue;
          const bgColor = evaluateColorScale(rule, num, stats.min, stats.max);
          if (bgColor) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(
              Math.round(cellX),
              Math.round(cellY),
              Math.round(cellW),
              Math.round(cellH),
            );
          }
        }

        // Conditional format: data bars
        for (const rule of conditionalRules) {
          if (rule.condition !== "dataBar") continue;
          const { range: rng } = rule;
          if (
            r < rng.startRow ||
            r > rng.endRow ||
            c < rng.startCol ||
            c > rng.endCol
          )
            continue;
          const num = cellValue != null ? Number(cellValue) : NaN;
          if (isNaN(num)) continue;
          const stats = condRangeStats.get(rule.id);
          if (!stats || stats.max === stats.min) continue;
          const ratio = (num - stats.min) / (stats.max - stats.min);
          const barW = Math.round(cellW * ratio);
          ctx.fillStyle = rule.values[0] ?? "#4285f4";
          ctx.globalAlpha = 0.3;
          ctx.fillRect(
            Math.round(cellX),
            Math.round(cellY),
            barW,
            Math.round(cellH),
          );
          ctx.globalAlpha = 1.0;
        }

        // Check for checkbox validation type
        const valRule = validationRules?.get(getCellKey(r, c));
        if (valRule?.type === "checkbox") {
          const cx = Math.round(cellX + cellW / 2);
          const cy = Math.round(cellY + cellH / 2);
          const half = CHECKBOX_SIZE / 2;
          // Draw checkbox box
          ctx.strokeStyle = "#5f6368";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - half, cy - half, CHECKBOX_SIZE, CHECKBOX_SIZE);
          // Fill if checked
          const checked =
            cellValue === true ||
            cellValue === "TRUE" ||
            cellValue === "true" ||
            cellValue === 1;
          if (checked) {
            ctx.fillStyle = HYPERLINK_COLOR;
            ctx.fillRect(cx - half, cy - half, CHECKBOX_SIZE, CHECKBOX_SIZE);
            // Draw checkmark
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 3, cy);
            ctx.lineTo(cx - 1, cy + 3);
            ctx.lineTo(cx + 4, cy - 3);
            ctx.stroke();
          }
          continue;
        }

        // Check for sparkline
        const strValue = cellValue != null ? String(cellValue) : "";
        if (
          typeof cellValue === "string" &&
          strValue.startsWith("__SPARKLINE__")
        ) {
          try {
            const json = strValue.slice("__SPARKLINE__".length);
            const sparkData = JSON.parse(json) as {
              data: number[];
              type?: string;
            };
            const data = sparkData.data;
            if (data && data.length > 1) {
              const pad = 3;
              const sparkX = Math.round(cellX) + pad;
              const sparkY = Math.round(cellY) + pad;
              const sparkW = Math.round(cellW) - pad * 2;
              const sparkH = Math.round(cellH) - pad * 2;
              const minV = Math.min(...data);
              const maxV = Math.max(...data);
              const range = maxV - minV || 1;

              ctx.save();
              ctx.beginPath();
              ctx.rect(
                Math.round(cellX),
                Math.round(cellY),
                Math.round(cellW),
                Math.round(cellH),
              );
              ctx.clip();

              if (sparkData.type === "bar") {
                const barWidth = sparkW / data.length;
                for (let i = 0; i < data.length; i++) {
                  const barH = ((data[i] - minV) / range) * sparkH;
                  ctx.fillStyle = "#4285f4";
                  ctx.fillRect(
                    sparkX + i * barWidth + 1,
                    sparkY + sparkH - barH,
                    Math.max(barWidth - 2, 1),
                    barH,
                  );
                }
              } else {
                // line sparkline
                ctx.strokeStyle = "#4285f4";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i < data.length; i++) {
                  const px = sparkX + (i / (data.length - 1)) * sparkW;
                  const py =
                    sparkY + sparkH - ((data[i] - minV) / range) * sparkH;
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.stroke();
              }
              ctx.restore();
            }
          } catch {
            // Invalid sparkline data, skip
          }
          continue;
        }

        // Check for image
        if (cellData?.image) {
          const imgUrl = cellData.image.url;
          const cache = imageCacheRef.current;
          let img = cache.get(imgUrl);
          if (!img) {
            img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgUrl;
            cache.set(imgUrl, img);
            img.onload = () => scheduleRedraw();
          }
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(
              Math.round(cellX),
              Math.round(cellY),
              Math.round(cellW),
              Math.round(cellH),
            );
            ctx.clip();
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const cellAspect = cellW / cellH;
            let drawW: number, drawH: number, drawX: number, drawY: number;
            if (imgAspect > cellAspect) {
              drawW = cellW - 4;
              drawH = drawW / imgAspect;
              drawX = cellX + 2;
              drawY = cellY + (cellH - drawH) / 2;
            } else {
              drawH = cellH - 4;
              drawW = drawH * imgAspect;
              drawX = cellX + (cellW - drawW) / 2;
              drawY = cellY + 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();
          }
          continue;
        }

        // Draw text content
        if (cellValue != null && cellValue !== "") {
          const fmt = cellData?.format;
          // Check for hyperlink
          const isHyperlink =
            !!cellData?.hyperlink ||
            (typeof cellValue === "string" &&
              (strValue.startsWith("http://") ||
                strValue.startsWith("https://")));

          // Build font string from format properties
          const fontParts: string[] = [];
          if (fmt?.italic) fontParts.push("italic");
          if (fmt?.bold) fontParts.push("bold");
          const fontSize = fmt?.fontSize ?? 13;
          const fontFamily = fmt?.fontFamily ?? "Arial, sans-serif";
          fontParts.push(`${fontSize}px`);
          fontParts.push(fontFamily);
          ctx.font = fontParts.join(" ");

          ctx.fillStyle = isHyperlink
            ? HYPERLINK_COLOR
            : (fmt?.textColor ?? "#000000");

          // Vertical alignment
          const vAlign = fmt?.verticalAlign ?? "middle";
          ctx.textBaseline =
            vAlign === "top"
              ? "top"
              : vAlign === "bottom"
                ? "bottom"
                : "middle";

          // Horizontal alignment
          const hAlign = fmt?.horizontalAlign ?? "left";
          ctx.textAlign = hAlign;

          const displayValue =
            isHyperlink && cellData?.hyperlink?.label
              ? cellData.hyperlink.label
              : formatCellValue(cellValue, fmt?.numberFormat);
          const pad = 4;
          // Offset for icon set icons
          let iconOffset = 0;
          const textX =
            hAlign === "center"
              ? Math.round(cellX + cellW / 2)
              : hAlign === "right"
                ? Math.round(cellX + cellW - pad)
                : Math.round(cellX + pad + iconOffset);
          const textY =
            vAlign === "top"
              ? Math.round(cellY + pad)
              : vAlign === "bottom"
                ? Math.round(cellY + cellH - pad)
                : Math.round(cellY + cellH / 2);

          ctx.save();
          ctx.beginPath();
          ctx.rect(
            Math.round(cellX),
            Math.round(cellY),
            Math.round(cellW),
            Math.round(cellH),
          );
          ctx.clip();

          // Conditional format: icon sets (draw icon before text)
          for (const rule of conditionalRules) {
            if (rule.condition !== "iconSet") continue;
            const { range: rng } = rule;
            if (
              r < rng.startRow ||
              r > rng.endRow ||
              c < rng.startCol ||
              c > rng.endCol
            )
              continue;
            const num = cellValue != null ? Number(cellValue) : NaN;
            if (isNaN(num)) continue;
            const stats = condRangeStats.get(rule.id);
            if (!stats || stats.max === stats.min) continue;
            const ratio = (num - stats.min) / (stats.max - stats.min);
            // Pick icon based on thirds
            let icon: string;
            let iconColor: string;
            if (ratio >= 0.67) {
              icon = "\u25B2"; // ▲ up arrow
              iconColor = "#34a853";
            } else if (ratio >= 0.33) {
              icon = "\u25B6"; // ▶ right arrow
              iconColor = "#fbbc04";
            } else {
              icon = "\u25BC"; // ▼ down arrow
              iconColor = "#ea4335";
            }
            ctx.fillStyle = iconColor;
            ctx.font = "10px Arial, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(
              icon,
              Math.round(cellX + 2),
              Math.round(cellY + cellH / 2),
            );
            iconOffset = 14;
            // Restore font/color for text
            ctx.font = fontParts.join(" ");
            ctx.fillStyle = isHyperlink
              ? HYPERLINK_COLOR
              : (fmt?.textColor ?? "#000000");
            ctx.textAlign = hAlign;
            ctx.textBaseline =
              vAlign === "top"
                ? "top"
                : vAlign === "bottom"
                  ? "bottom"
                  : "middle";
            break;
          }

          const finalTextX =
            iconOffset > 0 && hAlign === "left"
              ? Math.round(cellX + pad + iconOffset)
              : textX;
          ctx.fillText(displayValue, finalTextX, textY);

          // Underline (always for hyperlinks, or if format says so)
          if (fmt?.underline || isHyperlink) {
            const metrics = ctx.measureText(displayValue);
            const lineY = textY + 2;
            const lineStartX =
              hAlign === "center"
                ? finalTextX - metrics.width / 2
                : hAlign === "right"
                  ? finalTextX - metrics.width
                  : finalTextX;
            ctx.beginPath();
            ctx.strokeStyle = isHyperlink
              ? HYPERLINK_COLOR
              : (fmt?.textColor ?? "#000000");
            ctx.lineWidth = 1;
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(lineStartX + metrics.width, lineY);
            ctx.stroke();
          }

          // Strikethrough
          if (fmt?.strikethrough) {
            const metrics = ctx.measureText(displayValue);
            const lineY =
              vAlign === "top"
                ? textY + fontSize / 2
                : vAlign === "bottom"
                  ? textY - fontSize / 2
                  : textY;
            const lineStartX =
              hAlign === "center"
                ? finalTextX - metrics.width / 2
                : hAlign === "right"
                  ? finalTextX - metrics.width
                  : finalTextX;
            ctx.beginPath();
            ctx.strokeStyle = fmt.textColor ?? "#000000";
            ctx.lineWidth = 1;
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(lineStartX + metrics.width, lineY);
            ctx.stroke();
          }

          ctx.restore();
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;

    for (let r = visStartRow; r <= endRow + 1; r++) {
      if (gs.hiddenRows.has(r)) continue;
      const y = Math.round(gs.getRowY(r) - gs.scrollTop + chh) + 0.5;
      ctx.beginPath();
      ctx.moveTo(rhw, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let c = visStartCol; c <= endCol + 1; c++) {
      if (gs.hiddenCols.has(c)) continue;
      const x = Math.round(gs.getColumnX(c) - gs.scrollLeft + rhw) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, chh);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.restore();

    // Draw selections
    for (const sel of ui.selections) {
      const minRow = Math.min(sel.start.row, sel.end.row);
      const maxRow = Math.max(sel.start.row, sel.end.row);
      const minCol = Math.min(sel.start.col, sel.end.col);
      const maxCol = Math.max(sel.start.col, sel.end.col);

      const selX = gs.getColumnX(minCol) - gs.scrollLeft + rhw;
      const selY = gs.getRowY(minRow) - gs.scrollTop + chh;

      let selW = 0;
      for (let c = minCol; c <= maxCol; c++) {
        if (!gs.hiddenCols.has(c)) {
          selW += gs.columnWidths.get(c) ?? gs.defaultColWidth;
        }
      }
      let selH = 0;
      for (let r = minRow; r <= maxRow; r++) {
        if (!gs.hiddenRows.has(r)) {
          selH += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(rhw, chh, width - rhw, height - chh);
      ctx.clip();

      ctx.fillStyle = SELECTION_BG;
      ctx.fillRect(
        Math.round(selX),
        Math.round(selY),
        Math.round(selW),
        Math.round(selH),
      );

      ctx.strokeStyle = SELECTION_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.round(selX),
        Math.round(selY),
        Math.round(selW),
        Math.round(selH),
      );

      // Fill handle
      if (!ui.isEditing) {
        const handleX = Math.round(selX + selW) - FILL_HANDLE_SIZE / 2;
        const handleY = Math.round(selY + selH) - FILL_HANDLE_SIZE / 2;
        ctx.fillStyle = SELECTION_BORDER;
        ctx.fillRect(handleX, handleY, FILL_HANDLE_SIZE, FILL_HANDLE_SIZE);
      }

      ctx.restore();
    }

    // Frozen pane lines
    if (gs.frozenRows > 0) {
      const frozenY = Math.round(gs.getRowY(gs.frozenRows) + chh) + 0.5;
      ctx.strokeStyle = FROZEN_LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, frozenY);
      ctx.lineTo(width, frozenY);
      ctx.stroke();
    }
    if (gs.frozenCols > 0) {
      const frozenX = Math.round(gs.getColumnX(gs.frozenCols) + rhw) + 0.5;
      ctx.strokeStyle = FROZEN_LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(frozenX, 0);
      ctx.lineTo(frozenX, height);
      ctx.stroke();
    }

    // Draw column headers
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(rhw, 0, width - rhw, chh);
    ctx.strokeStyle = HEADER_BORDER;
    ctx.lineWidth = 1;

    for (let c = visStartCol; c <= endCol; c++) {
      if (gs.hiddenCols.has(c)) continue;
      const colX = gs.getColumnX(c) - gs.scrollLeft + rhw;
      const colW = gs.columnWidths.get(c) ?? gs.defaultColWidth;

      ctx.beginPath();
      ctx.moveTo(Math.round(colX) + 0.5, 0);
      ctx.lineTo(Math.round(colX) + 0.5, chh);
      ctx.stroke();

      ctx.font = HEADER_FONT;
      ctx.fillStyle = HEADER_TEXT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        colToLetter(c),
        Math.round(colX + colW / 2),
        Math.round(chh / 2),
      );
    }

    ctx.beginPath();
    ctx.moveTo(rhw, Math.round(chh) + 0.5);
    ctx.lineTo(width, Math.round(chh) + 0.5);
    ctx.stroke();

    // Draw row headers
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(0, chh, rhw, height - chh);

    for (let r = visStartRow; r <= endRow; r++) {
      if (gs.hiddenRows.has(r)) continue;
      const rowY = gs.getRowY(r) - gs.scrollTop + chh;
      const rowH = gs.rowHeights.get(r) ?? gs.defaultRowHeight;

      ctx.strokeStyle = HEADER_BORDER;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(rowY) + 0.5);
      ctx.lineTo(rhw, Math.round(rowY) + 0.5);
      ctx.stroke();

      ctx.font = HEADER_FONT;
      ctx.fillStyle = HEADER_TEXT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        String(r + 1),
        Math.round(rhw / 2),
        Math.round(rowY + rowH / 2),
      );
    }

    ctx.beginPath();
    ctx.moveTo(Math.round(rhw) + 0.5, chh);
    ctx.lineTo(Math.round(rhw) + 0.5, height);
    ctx.stroke();

    // Top-left corner
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(0, 0, rhw, chh);
    ctx.strokeStyle = HEADER_BORDER;
    ctx.strokeRect(0, 0, rhw, chh);

    // Draw row grouping +/- buttons in row header area
    for (const group of rowGroups) {
      const groupStartY = gs.getRowY(group.start) - gs.scrollTop + chh;
      const btnX = 2;
      const btnY = Math.round(groupStartY + 2);
      // Draw bracket line
      if (!group.collapsed) {
        const groupEndY =
          gs.getRowY(group.end) -
          gs.scrollTop +
          chh +
          (gs.rowHeights.get(group.end) ?? gs.defaultRowHeight);
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(btnX + GROUP_BTN_SIZE / 2, btnY + GROUP_BTN_SIZE);
        ctx.lineTo(btnX + GROUP_BTN_SIZE / 2, groupEndY - 2);
        ctx.lineTo(btnX + GROUP_BTN_SIZE, groupEndY - 2);
        ctx.stroke();
      }
      // Draw button background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(btnX, btnY, GROUP_BTN_SIZE, GROUP_BTN_SIZE);
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, GROUP_BTN_SIZE, GROUP_BTN_SIZE);
      // Draw +/- text
      ctx.fillStyle = "#333";
      ctx.font = "10px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        group.collapsed ? "+" : "\u2212",
        btnX + GROUP_BTN_SIZE / 2,
        btnY + GROUP_BTN_SIZE / 2,
      );
    }

    // Draw column grouping +/- buttons in column header area
    for (const group of colGroups) {
      const groupStartX = gs.getColumnX(group.start) - gs.scrollLeft + rhw;
      const btnX = Math.round(groupStartX + 2);
      const btnY = 2;
      // Draw bracket line
      if (!group.collapsed) {
        const groupEndX =
          gs.getColumnX(group.end) -
          gs.scrollLeft +
          rhw +
          (gs.columnWidths.get(group.end) ?? gs.defaultColWidth);
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(btnX + GROUP_BTN_SIZE, btnY + GROUP_BTN_SIZE / 2);
        ctx.lineTo(groupEndX - 2, btnY + GROUP_BTN_SIZE / 2);
        ctx.lineTo(groupEndX - 2, btnY + GROUP_BTN_SIZE);
        ctx.stroke();
      }
      // Draw button background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(btnX, btnY, GROUP_BTN_SIZE, GROUP_BTN_SIZE);
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, GROUP_BTN_SIZE, GROUP_BTN_SIZE);
      // Draw +/- text
      ctx.fillStyle = "#333";
      ctx.font = "10px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        group.collapsed ? "+" : "\u2212",
        btnX + GROUP_BTN_SIZE / 2,
        btnY + GROUP_BTN_SIZE / 2,
      );
    }
  }, [getActiveSheetId]);

  const scheduleRedraw = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Subscribe to store changes for redraw
  useEffect(() => {
    const unsubs = [
      useGridStore.subscribe(scheduleRedraw),
      useUIStore.subscribe(scheduleRedraw),
      useCellStore.subscribe(scheduleRedraw),
      useSpreadsheetStore.subscribe(scheduleRedraw),
      useValidationStore.subscribe(scheduleRedraw),
      useDataStore.subscribe(scheduleRedraw),
      useFormatStore.subscribe(scheduleRedraw),
    ];
    scheduleRedraw();
    return () => {
      unsubs.forEach((u) => u());
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [scheduleRedraw]);

  // Observe container size — use primitive state to avoid new-object re-renders
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerWidth((prev) => (prev === width ? prev : width));
        setContainerHeight((prev) => (prev === height ? prev : height));
        setViewportSize(width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [setViewportSize]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setScroll(el.scrollTop, el.scrollLeft);
  }, [setScroll]);

  // Edit commit handler
  const handleCommitEdit = useCallback(
    (value: string, direction: "down" | "right" | "none") => {
      const ui = useUIStore.getState();
      if (!ui.editingCell) return;
      const activeSheetId = getActiveSheetId();
      const { row, col } = ui.editingCell;
      const cellStore = useCellStore.getState();
      const existing = cellStore.getCell(activeSheetId, row, col);

      // Build a cell value resolver for the formula engine
      const buildGetCellValue = (): CellValueGetter => {
        return (sheet, refCol, refRow) => {
          const sid = sheet ?? activeSheetId;
          const cell = useCellStore.getState().getCell(sid, refRow, refCol);
          if (!cell) return null;
          if (typeof cell.value === "number" || typeof cell.value === "boolean")
            return cell.value;
          if (cell.value === null || cell.value === "") return null;
          const num = Number(cell.value);
          if (!isNaN(num)) return num;
          return cell.value;
        };
      };

      if (value !== "") {
        const formulaState = useFormulaStore.getState();
        const key = cellId(undefined, col, row);

        if (value.startsWith("=")) {
          // Formula: evaluate and store computed result
          const getCellValue = buildGetCellValue();
          const isValid = formulaState.updateDependencies(key, value);
          const result = isValid
            ? formulaState.evaluateFormula(value, getCellValue, key)
            : "#REF!";

          cellStore.setCell(activeSheetId, row, col, {
            ...existing,
            value: result,
            formula: value,
          });
        } else {
          // Plain value: clear formula, store value
          cellStore.setCell(activeSheetId, row, col, {
            ...existing,
            value,
            formula: undefined,
          });
          // Remove stale dependencies if this cell previously had a formula
          if (existing?.formula) {
            formulaState.updateDependencies(key, "");
          }
        }

        // Recalculate any cells that depend on this cell
        const getCellValue = buildGetCellValue();
        const getFormula = (cellKey: string) => {
          try {
            const parsed = parseCellId(cellKey);
            const sid = parsed.sheet ?? activeSheetId;
            return useCellStore.getState().getCell(sid, parsed.row, parsed.col)
              ?.formula;
          } catch {
            return undefined;
          }
        };
        const updates = formulaState.recalculate(key, getFormula, getCellValue);
        for (const [depKey, depValue] of updates) {
          try {
            const parsed = parseCellId(depKey);
            const sid = parsed.sheet ?? activeSheetId;
            const depCell = useCellStore
              .getState()
              .getCell(sid, parsed.row, parsed.col);
            useCellStore.getState().setCell(sid, parsed.row, parsed.col, {
              ...depCell,
              value: depValue,
            });
          } catch {
            // Skip invalid cell keys
          }
        }
      } else {
        cellStore.deleteCell(activeSheetId, row, col);
      }

      const gs = useGridStore.getState();
      const nextPos = { ...ui.editingCell };

      if (direction === "down") {
        nextPos.row = Math.min(ui.editingCell.row + 1, gs.totalRows - 1);
      } else if (direction === "right") {
        nextPos.col = Math.min(ui.editingCell.col + 1, gs.totalCols - 1);
      }

      commitEdit();
      setSelectedCell(nextPos);
    },
    [commitEdit, setSelectedCell, getActiveSheetId],
  );

  const handleCancelEdit = useCallback(() => {
    cancelEdit();
  }, [cancelEdit]);

  // Clipboard helpers
  const performCopy = useCallback(
    (mode: "copy" | "cut") => {
      const ui = useUIStore.getState();
      if (ui.selections.length === 0) return;
      const sel = ui.selections[ui.selections.length - 1];
      const minRow = Math.min(sel.start.row, sel.end.row);
      const maxRow = Math.max(sel.start.row, sel.end.row);
      const minCol = Math.min(sel.start.col, sel.end.col);
      const maxCol = Math.max(sel.start.col, sel.end.col);
      const activeSheetId = getActiveSheetId();
      const copied = useCellStore
        .getState()
        .getCellsInRangeWithKeys(activeSheetId, minRow, minCol, maxRow, maxCol);
      if (mode === "copy") {
        useClipboardStore.getState().copy(copied, sel);
      } else {
        useClipboardStore.getState().cut(copied, sel);
      }
    },
    [getActiveSheetId],
  );

  const performPaste = useCallback(
    (pasteMode?: "values" | "format" | "transpose") => {
      const ui = useUIStore.getState();
      if (!ui.selectedCell) return;
      const activeSheetId = getActiveSheetId();
      const clipboard = useClipboardStore.getState();
      const { cells, mode, sourceRange } = clipboard.paste(ui.selectedCell);

      if (cells.size === 0 || !sourceRange) return;

      const cs = useCellStore.getState();

      if (pasteMode === "transpose") {
        const minSrcRow = Math.min(sourceRange.start.row, sourceRange.end.row);
        const minSrcCol = Math.min(sourceRange.start.col, sourceRange.end.col);
        for (const [key, cellData] of cells) {
          const [r, c] = key.split(",").map(Number);
          const relRow = r - ui.selectedCell.row;
          const relCol = c - ui.selectedCell.col;
          const newRow = ui.selectedCell.row + relCol;
          const newCol = ui.selectedCell.col + relRow;
          cs.setCell(activeSheetId, newRow, newCol, cellData);
        }
        void minSrcRow;
        void minSrcCol;
      } else {
        for (const [key, cellData] of cells) {
          const [r, c] = key.split(",").map(Number);
          if (pasteMode === "values") {
            cs.setCell(activeSheetId, r, c, { value: cellData.value });
          } else if (pasteMode === "format") {
            const existing = cs.getCell(activeSheetId, r, c);
            cs.setCell(activeSheetId, r, c, {
              value: existing?.value ?? null,
              format: cellData.format,
            });
          } else {
            cs.setCell(activeSheetId, r, c, cellData);
          }
        }
      }

      if (mode === "cut" && sourceRange) {
        cs.clearRange(
          activeSheetId,
          Math.min(sourceRange.start.row, sourceRange.end.row),
          Math.min(sourceRange.start.col, sourceRange.end.col),
          Math.max(sourceRange.start.row, sourceRange.end.row),
          Math.max(sourceRange.start.col, sourceRange.end.col),
        );
        useClipboardStore.getState().clear();
      }
    },
    [getActiveSheetId],
  );

  // Row/Col operations
  const insertRowAt = useCallback(
    (row: number, position: "above" | "below") => {
      const gs = useGridStore.getState();
      const activeSheetId = getActiveSheetId();
      const insertAt = position === "above" ? row : row + 1;
      useCellStore
        .getState()
        .insertRows(activeSheetId, insertAt, 1, gs.totalRows + 1);
      useGridStore.getState().insertRowHeights(insertAt, 1);
      useGridStore.getState().setTotalRows(gs.totalRows + 1);
    },
    [getActiveSheetId],
  );

  const insertColAt = useCallback(
    (col: number, position: "left" | "right") => {
      const gs = useGridStore.getState();
      const activeSheetId = getActiveSheetId();
      const insertAt = position === "left" ? col : col + 1;
      useCellStore
        .getState()
        .insertCols(activeSheetId, insertAt, 1, gs.totalCols + 1);
      useGridStore.getState().insertColWidths(insertAt, 1);
      useGridStore.getState().setTotalCols(gs.totalCols + 1);
    },
    [getActiveSheetId],
  );

  const deleteRowsAt = useCallback(
    (rows: number[]) => {
      const gs = useGridStore.getState();
      const activeSheetId = getActiveSheetId();
      useCellStore.getState().deleteRows(activeSheetId, rows, gs.totalRows);
      useGridStore.getState().deleteRowHeights(rows);
      useGridStore
        .getState()
        .setTotalRows(Math.max(1, gs.totalRows - rows.length));
    },
    [getActiveSheetId],
  );

  const deleteColsAt = useCallback(
    (cols: number[]) => {
      const gs = useGridStore.getState();
      const activeSheetId = getActiveSheetId();
      useCellStore.getState().deleteCols(activeSheetId, cols, gs.totalCols);
      useGridStore.getState().deleteColWidths(cols);
      useGridStore
        .getState()
        .setTotalCols(Math.max(1, gs.totalCols - cols.length));
    },
    [getActiveSheetId],
  );

  // Auto-fit column width
  const autoFitColumn = useCallback(
    (col: number) => {
      const gs = useGridStore.getState();
      const activeSheetId = getActiveSheetId();
      const cs = useCellStore.getState();
      const sheetCells = cs.cells.get(activeSheetId);
      if (!sheetCells) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = CELL_FONT;

      let maxWidth = 40;
      for (let r = 0; r < gs.totalRows; r++) {
        const cellData = sheetCells.get(`${r},${col}`);
        if (cellData?.value != null && cellData.value !== "") {
          const textWidth = ctx.measureText(String(cellData.value)).width + 12;
          if (textWidth > maxWidth) maxWidth = textWidth;
        }
      }
      useGridStore.getState().setColumnWidth(col, Math.min(maxWidth, 400));
    },
    [getActiveSheetId],
  );

  // Fill handle execution
  const executeFill = useCallback(() => {
    const start = fillHandleStartRef.current;
    const end = fillHandleEndRef.current;
    if (!start || !end) return;

    const ui = useUIStore.getState();
    if (ui.selections.length === 0) return;
    const sel = ui.selections[ui.selections.length - 1];
    const minRow = Math.min(sel.start.row, sel.end.row);
    const maxRow = Math.max(sel.start.row, sel.end.row);
    const minCol = Math.min(sel.start.col, sel.end.col);
    const maxCol = Math.max(sel.start.col, sel.end.col);

    const activeSheetId = getActiveSheetId();
    const cs = useCellStore.getState();

    // Determine fill direction
    if (end.row > maxRow) {
      // Fill down
      const count = end.row - maxRow;
      for (let c = minCol; c <= maxCol; c++) {
        const sourceCells: CellData[] = [];
        for (let r = minRow; r <= maxRow; r++) {
          const cell = cs.getCell(activeSheetId, r, c);
          sourceCells.push(cell ?? { value: null });
        }
        const fillValues = generateFillValues(sourceCells, count);
        for (let i = 0; i < fillValues.length; i++) {
          cs.setCell(activeSheetId, maxRow + 1 + i, c, fillValues[i]);
        }
      }
      setSelections([
        {
          start: { row: minRow, col: minCol },
          end: { row: end.row, col: maxCol },
        },
      ]);
    } else if (end.col > maxCol) {
      // Fill right
      const count = end.col - maxCol;
      for (let r = minRow; r <= maxRow; r++) {
        const sourceCells: CellData[] = [];
        for (let c = minCol; c <= maxCol; c++) {
          const cell = cs.getCell(activeSheetId, r, c);
          sourceCells.push(cell ?? { value: null });
        }
        const fillValues = generateFillValues(sourceCells, count);
        for (let i = 0; i < fillValues.length; i++) {
          cs.setCell(activeSheetId, r, maxCol + 1 + i, fillValues[i]);
        }
      }
      setSelections([
        {
          start: { row: minRow, col: minCol },
          end: { row: maxRow, col: end.col },
        },
      ]);
    }
  }, [getActiveSheetId, setSelections]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button === 2) return; // right-click handled by context menu
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gs = useGridStore.getState();

      // Check resize col
      const resizeCol = getResizeCol(x, y);
      if (resizeCol >= 0) {
        dragModeRef.current = "resize-col";
        resizeColRef.current = resizeCol;
        resizeStartXRef.current = e.clientX;
        resizeStartSizeRef.current =
          gs.columnWidths.get(resizeCol) ?? gs.defaultColWidth;
        return;
      }

      // Check resize row
      const resizeRow = getResizeRow(x, y);
      if (resizeRow >= 0) {
        dragModeRef.current = "resize-row";
        resizeRowRef.current = resizeRow;
        resizeStartYRef.current = e.clientY;
        resizeStartSizeRef.current =
          gs.rowHeights.get(resizeRow) ?? gs.defaultRowHeight;
        return;
      }

      // Check fill handle
      if (isOnFillHandle(x, y)) {
        dragModeRef.current = "fill-handle";
        const ui = useUIStore.getState();
        const sel = ui.selections[ui.selections.length - 1];
        fillHandleStartRef.current = {
          row: Math.max(sel.start.row, sel.end.row),
          col: Math.max(sel.start.col, sel.end.col),
        };
        fillHandleEndRef.current = fillHandleStartRef.current;
        return;
      }

      // Check row group toggle buttons
      if (x < gs.rowHeaderWidth && y > gs.colHeaderHeight) {
        const activeSheetId = getActiveSheetId();
        const rowGroups = useDataStore.getState().getRowGroups(activeSheetId);
        for (const group of rowGroups) {
          const groupStartY =
            gs.getRowY(group.start) - gs.scrollTop + gs.colHeaderHeight;
          const btnX = 2;
          const btnY = Math.round(groupStartY + 2);
          if (
            x >= btnX &&
            x <= btnX + GROUP_BTN_SIZE &&
            y >= btnY &&
            y <= btnY + GROUP_BTN_SIZE
          ) {
            useDataStore.getState().toggleRowGroup(activeSheetId, group.start);
            return;
          }
        }
      }

      // Check column group toggle buttons
      if (y < gs.colHeaderHeight && x > gs.rowHeaderWidth) {
        const activeSheetId = getActiveSheetId();
        const colGroups = useDataStore.getState().getColGroups(activeSheetId);
        for (const group of colGroups) {
          const groupStartX =
            gs.getColumnX(group.start) - gs.scrollLeft + gs.rowHeaderWidth;
          const btnX = Math.round(groupStartX + 2);
          const btnY = 2;
          if (
            x >= btnX &&
            x <= btnX + GROUP_BTN_SIZE &&
            y >= btnY &&
            y <= btnY + GROUP_BTN_SIZE
          ) {
            useDataStore.getState().toggleColGroup(activeSheetId, group.start);
            return;
          }
        }
      }

      // Row header click
      if (x < gs.rowHeaderWidth && y > gs.colHeaderHeight) {
        const gridY = y - gs.colHeaderHeight + gs.scrollTop;
        const row = gs.getRowAtY(gridY);
        const range = {
          start: { row, col: 0 },
          end: { row, col: gs.totalCols - 1 },
        };
        if (e.ctrlKey || e.metaKey) {
          const ui = useUIStore.getState();
          setSelections([...ui.selections, range]);
        } else {
          setSelectedCell({ row, col: 0 });
          setSelections([range]);
        }
        return;
      }

      // Column header click
      if (y < gs.colHeaderHeight && x > gs.rowHeaderWidth) {
        const gridX = x - gs.rowHeaderWidth + gs.scrollLeft;
        const col = gs.getColAtX(gridX);
        const range = {
          start: { row: 0, col },
          end: { row: gs.totalRows - 1, col },
        };
        if (e.ctrlKey || e.metaKey) {
          const ui = useUIStore.getState();
          setSelections([...ui.selections, range]);
        } else {
          setSelectedCell({ row: 0, col });
          setSelections([range]);
        }
        return;
      }

      const pos = screenToGrid(x, y);
      if (!pos) return;

      const activeSheetId = getActiveSheetId();

      // Check for hyperlink Ctrl+Click
      if (e.ctrlKey || e.metaKey) {
        const cellData = useCellStore
          .getState()
          .getCell(activeSheetId, pos.row, pos.col);
        if (cellData) {
          let url: string | null = null;
          if (cellData.hyperlink) {
            url = cellData.hyperlink.url;
          } else if (
            typeof cellData.value === "string" &&
            (cellData.value.startsWith("http://") ||
              cellData.value.startsWith("https://"))
          ) {
            url = cellData.value;
          }
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
            return;
          }
        }
      }

      // Check for checkbox cell — single click toggles value
      const vs = useValidationStore.getState();
      const valRule = vs.getRule(activeSheetId, pos.row, pos.col);
      if (valRule?.type === "checkbox") {
        const cs = useCellStore.getState();
        const existing = cs.getCell(activeSheetId, pos.row, pos.col);
        const currentVal = existing?.value;
        const checked =
          currentVal === true ||
          currentVal === "TRUE" ||
          currentVal === "true" ||
          currentVal === 1;
        cs.setCell(activeSheetId, pos.row, pos.col, {
          ...existing,
          value: checked ? "FALSE" : "TRUE",
        });
        setSelectedCell(pos);
        return;
      }

      const ui = useUIStore.getState();
      if (ui.isEditing) {
        handleCommitEdit(ui.editValue, "none");
      }

      if (e.shiftKey && ui.selectedCell) {
        setSelections([{ start: ui.selectedCell, end: pos }]);
      } else if (e.ctrlKey || e.metaKey) {
        const newRange = { start: pos, end: pos };
        const existing = [...ui.selections];
        existing.push(newRange);
        setSelectedCell(pos);
        setSelections(existing);
      } else {
        setSelectedCell(pos);
        dragModeRef.current = "select";
        dragStartRef.current = pos;
      }
    },
    [
      screenToGrid,
      getResizeCol,
      getResizeRow,
      isOnFillHandle,
      setSelectedCell,
      setSelections,
      handleCommitEdit,
      getActiveSheetId,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update cursor based on position
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        if (isOnFillHandle(x, y)) {
          scrollContainer.style.cursor = "crosshair";
        } else if (getResizeCol(x, y) >= 0) {
          scrollContainer.style.cursor = "col-resize";
        } else if (getResizeRow(x, y) >= 0) {
          scrollContainer.style.cursor = "row-resize";
        } else {
          // Check if hovering over a hyperlink cell
          const pos = screenToGrid(x, y);
          let isHyperlink = false;
          if (pos) {
            const activeSheetId = getActiveSheetId();
            const cellData = useCellStore
              .getState()
              .getCell(activeSheetId, pos.row, pos.col);
            if (cellData) {
              isHyperlink =
                !!cellData.hyperlink ||
                (typeof cellData.value === "string" &&
                  (String(cellData.value).startsWith("http://") ||
                    String(cellData.value).startsWith("https://")));
            }
          }
          scrollContainer.style.cursor = isHyperlink ? "pointer" : "cell";
        }
      }

      if (dragModeRef.current === "select") {
        if (!dragStartRef.current) return;
        const pos = screenToGrid(x, y);
        if (!pos) return;
        setSelections([{ start: dragStartRef.current, end: pos }]);
      } else if (dragModeRef.current === "resize-col") {
        const delta = e.clientX - resizeStartXRef.current;
        const newWidth = Math.max(20, resizeStartSizeRef.current + delta);
        useGridStore.getState().setColumnWidth(resizeColRef.current, newWidth);
      } else if (dragModeRef.current === "resize-row") {
        const delta = e.clientY - resizeStartYRef.current;
        const newHeight = Math.max(10, resizeStartSizeRef.current + delta);
        useGridStore.getState().setRowHeight(resizeRowRef.current, newHeight);
      } else if (dragModeRef.current === "fill-handle") {
        const pos = screenToGrid(x, y);
        if (pos) {
          fillHandleEndRef.current = pos;
        }
      }
    },
    [
      screenToGrid,
      setSelections,
      isOnFillHandle,
      getResizeCol,
      getResizeRow,
      getActiveSheetId,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (dragModeRef.current === "fill-handle") {
      executeFill();
    }
    dragModeRef.current = "none";
    dragStartRef.current = null;
    fillHandleStartRef.current = null;
    fillHandleEndRef.current = null;
  }, [executeFill]);

  // Double-click
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Double-click on col header border → auto-fit
      const resizeCol = getResizeCol(x, y);
      if (resizeCol >= 0) {
        autoFitColumn(resizeCol);
        return;
      }

      const pos = screenToGrid(x, y);
      if (!pos) return;

      const activeSheetId = getActiveSheetId();
      const cellData = useCellStore
        .getState()
        .getCell(activeSheetId, pos.row, pos.col);
      const currentValue =
        cellData?.value != null ? String(cellData.value) : "";
      startEditing(pos, currentValue);
    },
    [screenToGrid, startEditing, getResizeCol, autoFitColumn, getActiveSheetId],
  );

  // Context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gs = useGridStore.getState();

      if (x < gs.rowHeaderWidth && y > gs.colHeaderHeight) {
        const gridY = y - gs.colHeaderHeight + gs.scrollTop;
        const row = gs.getRowAtY(gridY);
        setSelectedCell({ row, col: 0 });
        setSelections([
          {
            start: { row, col: 0 },
            end: { row, col: gs.totalCols - 1 },
          },
        ]);
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          target: "row",
          targetIndex: row,
        });
        return;
      }

      if (y < gs.colHeaderHeight && x > gs.rowHeaderWidth) {
        const gridX = x - gs.rowHeaderWidth + gs.scrollLeft;
        const col = gs.getColAtX(gridX);
        setSelectedCell({ row: 0, col });
        setSelections([
          {
            start: { row: 0, col },
            end: { row: gs.totalRows - 1, col },
          },
        ]);
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          target: "col",
          targetIndex: col,
        });
        return;
      }

      const pos = screenToGrid(x, y);
      if (pos) {
        setSelectedCell(pos);
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          target: "cell",
          targetIndex: 0,
        });
      }
    },
    [screenToGrid, setSelectedCell, setSelections],
  );

  const getContextMenuItems = useCallback(() => {
    if (!contextMenu) return [];
    const gs = useGridStore.getState();

    if (contextMenu.target === "row") {
      const row = contextMenu.targetIndex;
      const isHidden = gs.hiddenRows.has(row);
      return [
        {
          label: "Insert row above",
          action: () => insertRowAt(row, "above"),
        },
        {
          label: "Insert row below",
          action: () => insertRowAt(row, "below"),
        },
        { label: "Delete row", action: () => deleteRowsAt([row]) },
        { label: "", action: () => {}, separator: true },
        {
          label: isHidden ? "Unhide row" : "Hide row",
          action: () => {
            if (isHidden) {
              useGridStore.getState().unhideRows([row]);
            } else {
              useGridStore.getState().hideRows([row]);
            }
          },
        },
      ];
    }

    if (contextMenu.target === "col") {
      const col = contextMenu.targetIndex;
      const isHidden = gs.hiddenCols.has(col);
      return [
        {
          label: "Insert column left",
          action: () => insertColAt(col, "left"),
        },
        {
          label: "Insert column right",
          action: () => insertColAt(col, "right"),
        },
        { label: "Delete column", action: () => deleteColsAt([col]) },
        { label: "", action: () => {}, separator: true },
        {
          label: isHidden ? "Unhide column" : "Hide column",
          action: () => {
            if (isHidden) {
              useGridStore.getState().unhideCols([col]);
            } else {
              useGridStore.getState().hideCols([col]);
            }
          },
        },
      ];
    }

    // Cell context menu
    return [
      { label: "Copy", shortcut: "Ctrl+C", action: () => performCopy("copy") },
      { label: "Cut", shortcut: "Ctrl+X", action: () => performCopy("cut") },
      { label: "Paste", shortcut: "Ctrl+V", action: () => performPaste() },
      { label: "", action: () => {}, separator: true },
      {
        label: "Paste special: Values only",
        action: () => performPaste("values"),
      },
      {
        label: "Paste special: Format only",
        action: () => performPaste("format"),
      },
      {
        label: "Paste special: Transpose",
        action: () => performPaste("transpose"),
      },
    ];
  }, [
    contextMenu,
    insertRowAt,
    insertColAt,
    deleteRowsAt,
    deleteColsAt,
    performCopy,
    performPaste,
  ]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ui = useUIStore.getState();
      const gs = useGridStore.getState();

      if (ui.isEditing) return;
      if (!ui.selectedCell) return;

      const { row, col } = ui.selectedCell;
      const activeSheetId = getActiveSheetId();

      // Ctrl+B → toggle bold
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        useFormatStore.getState().toggleFormatOnSelection("bold");
        return;
      }

      // Ctrl+I → toggle italic
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        useFormatStore.getState().toggleFormatOnSelection("italic");
        return;
      }

      // Ctrl+U → toggle underline
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        useFormatStore.getState().toggleFormatOnSelection("underline");
        return;
      }

      // Ctrl+F → find
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        useFindReplaceStore.getState().open(false);
        return;
      }

      // Ctrl+H → find & replace
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        useFindReplaceStore.getState().open(true);
        return;
      }

      // Ctrl+A → select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedCell({ row: 0, col: 0 });
        setSelections([
          {
            start: { row: 0, col: 0 },
            end: { row: gs.totalRows - 1, col: gs.totalCols - 1 },
          },
        ]);
        return;
      }

      // Ctrl+C → copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        performCopy("copy");
        return;
      }

      // Ctrl+X → cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        performCopy("cut");
        return;
      }

      // Ctrl+V → paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        performPaste();
        return;
      }

      // Ctrl+Home → go to A1
      if ((e.ctrlKey || e.metaKey) && e.key === "Home") {
        e.preventDefault();
        setSelectedCell({ row: 0, col: 0 });
        setScroll(0, 0);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
          scrollContainerRef.current.scrollLeft = 0;
        }
        return;
      }

      // Ctrl+End → go to last cell with data
      if ((e.ctrlKey || e.metaKey) && e.key === "End") {
        e.preventDefault();
        const lastPos = useCellStore
          .getState()
          .getLastDataPosition(activeSheetId);
        setSelectedCell(lastPos);
        return;
      }

      // Page Up
      if (e.key === "PageUp") {
        e.preventDefault();
        const visibleRows = Math.floor(
          (gs.viewportHeight - gs.colHeaderHeight) / gs.defaultRowHeight,
        );
        const newRow = Math.max(0, row - visibleRows);
        setSelectedCell({ row: newRow, col });
        return;
      }

      // Page Down
      if (e.key === "PageDown") {
        e.preventDefault();
        const visibleRows = Math.floor(
          (gs.viewportHeight - gs.colHeaderHeight) / gs.defaultRowHeight,
        );
        const newRow = Math.min(gs.totalRows - 1, row + visibleRows);
        setSelectedCell({ row: newRow, col });
        return;
      }

      // Ctrl+Arrow → jump to data boundary
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowUp") {
        e.preventDefault();
        let newRow = row - 1;
        const cs = useCellStore.getState();
        const hasData = (r: number) => {
          const cell = cs.getCell(activeSheetId, r, col);
          return cell?.value != null && cell.value !== "";
        };
        const currentHasData = hasData(row);
        if (currentHasData) {
          while (newRow > 0 && hasData(newRow)) newRow--;
          if (!hasData(newRow) && newRow < row - 1) newRow++;
        } else {
          while (newRow > 0 && !hasData(newRow)) newRow--;
        }
        setSelectedCell({ row: Math.max(0, newRow), col });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowDown") {
        e.preventDefault();
        let newRow = row + 1;
        const cs = useCellStore.getState();
        const hasData = (r: number) => {
          const cell = cs.getCell(activeSheetId, r, col);
          return cell?.value != null && cell.value !== "";
        };
        const currentHasData = hasData(row);
        if (currentHasData) {
          while (newRow < gs.totalRows - 1 && hasData(newRow)) newRow++;
          if (!hasData(newRow) && newRow > row + 1) newRow--;
        } else {
          while (newRow < gs.totalRows - 1 && !hasData(newRow)) newRow++;
        }
        setSelectedCell({ row: Math.min(gs.totalRows - 1, newRow), col });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        let newCol = col - 1;
        const cs = useCellStore.getState();
        const hasData = (c: number) => {
          const cell = cs.getCell(activeSheetId, row, c);
          return cell?.value != null && cell.value !== "";
        };
        const currentHasData = hasData(col);
        if (currentHasData) {
          while (newCol > 0 && hasData(newCol)) newCol--;
          if (!hasData(newCol) && newCol < col - 1) newCol++;
        } else {
          while (newCol > 0 && !hasData(newCol)) newCol--;
        }
        setSelectedCell({ row, col: Math.max(0, newCol) });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
        e.preventDefault();
        let newCol = col + 1;
        const cs = useCellStore.getState();
        const hasData = (c: number) => {
          const cell = cs.getCell(activeSheetId, row, c);
          return cell?.value != null && cell.value !== "";
        };
        const currentHasData = hasData(col);
        if (currentHasData) {
          while (newCol < gs.totalCols - 1 && hasData(newCol)) newCol++;
          if (!hasData(newCol) && newCol > col + 1) newCol--;
        } else {
          while (newCol < gs.totalCols - 1 && !hasData(newCol)) newCol++;
        }
        setSelectedCell({ row, col: Math.min(gs.totalCols - 1, newCol) });
        return;
      }

      // Arrow keys (no ctrl)
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCell({ row: Math.max(0, row - 1), col });
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCell({ row: Math.min(gs.totalRows - 1, row + 1), col });
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedCell({ row, col: Math.max(0, col - 1) });
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedCell({ row, col: Math.min(gs.totalCols - 1, col + 1) });
        return;
      }

      // Tab / Shift+Tab
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedCell({ row, col: Math.max(0, col - 1) });
        } else {
          setSelectedCell({ row, col: Math.min(gs.totalCols - 1, col + 1) });
        }
        return;
      }

      // Enter / Shift+Enter
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedCell({ row: Math.max(0, row - 1), col });
        } else {
          setSelectedCell({ row: Math.min(gs.totalRows - 1, row + 1), col });
        }
        return;
      }

      // F2 → edit mode
      if (e.key === "F2") {
        e.preventDefault();
        const cellData = useCellStore
          .getState()
          .getCell(activeSheetId, row, col);
        const currentValue =
          cellData?.value != null ? String(cellData.value) : "";
        startEditing({ row, col }, currentValue);
        return;
      }

      // Escape
      if (e.key === "Escape") {
        e.preventDefault();
        setContextMenu(null);
        return;
      }

      // Delete / Backspace → clear selected cells
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const cs = useCellStore.getState();
        for (const sel of ui.selections) {
          cs.clearRange(
            activeSheetId,
            Math.min(sel.start.row, sel.end.row),
            Math.min(sel.start.col, sel.end.col),
            Math.max(sel.start.row, sel.end.row),
            Math.max(sel.start.col, sel.end.col),
          );
        }
        return;
      }

      // Printable character → start editing
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startEditing({ row, col }, e.key);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    setSelectedCell,
    setSelections,
    startEditing,
    performCopy,
    performPaste,
    setScroll,
    getActiveSheetId,
  ]);

  const scrollDims = useMemo(computeScrollDimensions, [
    computeScrollDimensions,
  ]);

  return (
    <div
      ref={containerRef}
      data-testid="grid-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="grid-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
      <CellEditor onCommit={handleCommitEdit} onCancel={handleCancelEdit} />
      <div
        ref={scrollContainerRef}
        data-testid="grid-scroll-container"
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: containerWidth,
          height: containerHeight,
          overflow: "auto",
          cursor: "cell",
        }}
      >
        <div
          style={{
            width: scrollDims.width,
            height: scrollDims.height,
            pointerEvents: "none",
          }}
        />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
