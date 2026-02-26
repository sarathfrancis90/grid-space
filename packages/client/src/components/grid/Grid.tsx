import { useEffect, useRef, useCallback, useState } from "react";
import { useGridStore } from "../../stores/gridStore";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { colToLetter } from "../../utils/coordinates";
import { CellEditor } from "./CellEditor";
import type { CellPosition } from "../../types/grid";

const GRID_LINE_COLOR = "#e2e2e2";
const HEADER_BG = "#f8f9fa";
const HEADER_TEXT = "#666666";
const HEADER_BORDER = "#c0c0c0";
const SELECTION_BG = "rgba(26, 115, 232, 0.1)";
const SELECTION_BORDER = "#1a73e8";
const CELL_FONT = "13px Arial, sans-serif";
const HEADER_FONT = "12px Arial, sans-serif";
const BUFFER_ROWS = 10;
const BUFFER_COLS = 5;

export function Grid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<CellPosition | null>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const gridState = useGridStore.getState;
  const uiState = useUIStore.getState;
  const cellState = useCellStore.getState;

  const setScroll = useGridStore((s) => s.setScroll);
  const setViewportSize = useGridStore((s) => s.setViewportSize);
  const setSelectedCell = useUIStore((s) => s.setSelectedCell);
  const setSelections = useUIStore((s) => s.setSelections);
  const startEditing = useUIStore((s) => s.startEditing);
  const commitEdit = useUIStore((s) => s.commitEdit);
  const cancelEdit = useUIStore((s) => s.cancelEdit);

  // Compute total scrollable dimensions
  const computeScrollDimensions = useCallback(() => {
    const gs = gridState();
    let totalWidth = 0;
    for (let c = 0; c < gs.totalCols; c++) {
      totalWidth += gs.columnWidths.get(c) ?? gs.defaultColWidth;
    }
    let totalHeight = 0;
    for (let r = 0; r < gs.totalRows; r++) {
      totalHeight += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
    }
    return {
      width: totalWidth + gs.rowHeaderWidth,
      height: totalHeight + gs.colHeaderHeight,
    };
  }, [gridState]);

  // Screen coords → grid coords
  const screenToGrid = useCallback(
    (screenX: number, screenY: number): CellPosition | null => {
      const gs = gridState();
      const x = screenX - gs.rowHeaderWidth + gs.scrollLeft;
      const y = screenY - gs.colHeaderHeight + gs.scrollTop;
      if (x < 0 || y < 0) return null;
      const col = gs.getColAtX(x);
      const row = gs.getRowAtY(y);
      return { row, col };
    },
    [gridState],
  );

  // Canvas draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const gs = gridState();
    const ui = uiState();
    const cs = cellState();
    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
    const sheetCells = cs.cells.get(activeSheetId);

    const width = gs.viewportWidth;
    const height = gs.viewportHeight;

    // Set canvas size for retina
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    const rhw = gs.rowHeaderWidth;
    const chh = gs.colHeaderHeight;

    // Compute visible range
    let startCol = 0;
    let accX = 0;
    for (let c = 0; c < gs.totalCols; c++) {
      const cw = gs.columnWidths.get(c) ?? gs.defaultColWidth;
      if (accX + cw > gs.scrollLeft) {
        startCol = c;
        break;
      }
      accX += cw;
    }
    const firstColOffset = accX;

    let startRow = 0;
    let accY = 0;
    for (let r = 0; r < gs.totalRows; r++) {
      const rh = gs.rowHeights.get(r) ?? gs.defaultRowHeight;
      if (accY + rh > gs.scrollTop) {
        startRow = r;
        break;
      }
      accY += rh;
    }
    const firstRowOffset = accY;

    const visStartCol = Math.max(0, startCol - BUFFER_COLS);
    const visStartRow = Math.max(0, startRow - BUFFER_ROWS);

    // Find end col/row
    let endCol = startCol;
    let tempX = firstColOffset - gs.scrollLeft + rhw;
    for (let c = startCol; c < gs.totalCols; c++) {
      if (tempX > width) break;
      endCol = c;
      tempX += gs.columnWidths.get(c) ?? gs.defaultColWidth;
    }
    endCol = Math.min(gs.totalCols - 1, endCol + BUFFER_COLS);

    let endRow = startRow;
    let tempY = firstRowOffset - gs.scrollTop + chh;
    for (let r = startRow; r < gs.totalRows; r++) {
      if (tempY > height) break;
      endRow = r;
      tempY += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
    }
    endRow = Math.min(gs.totalRows - 1, endRow + BUFFER_ROWS);

    // Draw cell backgrounds and content
    ctx.save();
    ctx.beginPath();
    ctx.rect(rhw, chh, width - rhw, height - chh);
    ctx.clip();

    for (let r = visStartRow; r <= endRow; r++) {
      for (let c = visStartCol; c <= endCol; c++) {
        const cellX = gs.getColumnX(c) - gs.scrollLeft + rhw;
        const cellY = gs.getRowY(r) - gs.scrollTop + chh;
        const cellW = gs.columnWidths.get(c) ?? gs.defaultColWidth;
        const cellH = gs.rowHeights.get(r) ?? gs.defaultRowHeight;

        // Cell background
        const cellKey = `${r},${c}`;
        const cellData = sheetCells?.get(cellKey);
        if (cellData?.format?.backgroundColor) {
          ctx.fillStyle = cellData.format.backgroundColor;
          ctx.fillRect(
            Math.round(cellX),
            Math.round(cellY),
            Math.round(cellW),
            Math.round(cellH),
          );
        }

        // Cell text
        if (cellData?.value != null && cellData.value !== "") {
          ctx.font = CELL_FONT;
          ctx.fillStyle = cellData.format?.textColor ?? "#000000";
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";

          const displayValue = String(cellData.value);
          const textX = Math.round(cellX + 4);
          const textY = Math.round(cellY + cellH / 2);

          ctx.save();
          ctx.beginPath();
          ctx.rect(
            Math.round(cellX),
            Math.round(cellY),
            Math.round(cellW),
            Math.round(cellH),
          );
          ctx.clip();
          ctx.fillText(displayValue, textX, textY);
          ctx.restore();
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let r = visStartRow; r <= endRow + 1; r++) {
      const y = Math.round(gs.getRowY(r) - gs.scrollTop + chh) + 0.5;
      ctx.beginPath();
      ctx.moveTo(rhw, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let c = visStartCol; c <= endCol + 1; c++) {
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
        selW += gs.columnWidths.get(c) ?? gs.defaultColWidth;
      }
      let selH = 0;
      for (let r = minRow; r <= maxRow; r++) {
        selH += gs.rowHeights.get(r) ?? gs.defaultRowHeight;
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
      ctx.restore();
    }

    // Draw column headers
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(rhw, 0, width - rhw, chh);
    ctx.strokeStyle = HEADER_BORDER;
    ctx.lineWidth = 1;

    for (let c = visStartCol; c <= endCol; c++) {
      const colX = gs.getColumnX(c) - gs.scrollLeft + rhw;
      const colW = gs.columnWidths.get(c) ?? gs.defaultColWidth;

      // Border
      ctx.beginPath();
      ctx.moveTo(Math.round(colX) + 0.5, 0);
      ctx.lineTo(Math.round(colX) + 0.5, chh);
      ctx.stroke();

      // Label
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

    // Header bottom border
    ctx.beginPath();
    ctx.moveTo(rhw, Math.round(chh) + 0.5);
    ctx.lineTo(width, Math.round(chh) + 0.5);
    ctx.stroke();

    // Draw row headers
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(0, chh, rhw, height - chh);

    for (let r = visStartRow; r <= endRow; r++) {
      const rowY = gs.getRowY(r) - gs.scrollTop + chh;
      const rowH = gs.rowHeights.get(r) ?? gs.defaultRowHeight;

      // Border
      ctx.strokeStyle = HEADER_BORDER;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(rowY) + 0.5);
      ctx.lineTo(rhw, Math.round(rowY) + 0.5);
      ctx.stroke();

      // Label
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

    // Header right border
    ctx.beginPath();
    ctx.moveTo(Math.round(rhw) + 0.5, chh);
    ctx.lineTo(Math.round(rhw) + 0.5, height);
    ctx.stroke();

    // Top-left corner
    ctx.fillStyle = HEADER_BG;
    ctx.fillRect(0, 0, rhw, chh);
    ctx.strokeStyle = HEADER_BORDER;
    ctx.strokeRect(0, 0, rhw, chh);
  }, [gridState, uiState, cellState]);

  // Schedule redraw
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
    ];
    scheduleRedraw();
    return () => {
      unsubs.forEach((u) => u());
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [scheduleRedraw]);

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
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

  // Mouse click handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gs = gridState();

      // Check if clicking on row header
      if (x < gs.rowHeaderWidth && y > gs.colHeaderHeight) {
        const gridY = y - gs.colHeaderHeight + gs.scrollTop;
        const row = gs.getRowAtY(gridY);
        const range = {
          start: { row, col: 0 },
          end: { row, col: gs.totalCols - 1 },
        };

        if (e.ctrlKey || e.metaKey) {
          const ui = uiState();
          setSelections([...ui.selections, range]);
        } else {
          setSelectedCell({ row, col: 0 });
          setSelections([range]);
        }
        return;
      }

      // Check if clicking on column header
      if (y < gs.colHeaderHeight && x > gs.rowHeaderWidth) {
        const gridX = x - gs.rowHeaderWidth + gs.scrollLeft;
        const col = gs.getColAtX(gridX);
        const range = {
          start: { row: 0, col },
          end: { row: gs.totalRows - 1, col },
        };

        if (e.ctrlKey || e.metaKey) {
          const ui = uiState();
          setSelections([...ui.selections, range]);
        } else {
          setSelectedCell({ row: 0, col });
          setSelections([range]);
        }
        return;
      }

      const pos = screenToGrid(x, y);
      if (!pos) return;

      const ui = uiState();

      // If editing, commit before changing selection
      if (ui.isEditing) {
        handleCommitEdit(ui.editValue, "none");
      }

      if (e.shiftKey && ui.selectedCell) {
        // Shift+click: extend selection
        const range = {
          start: ui.selectedCell,
          end: pos,
        };
        setSelections([range]);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl+click: add to selections
        const newRange = { start: pos, end: pos };
        setSelections([...ui.selections, newRange]);
        setSelectedCell(pos);
        // Re-set selections since setSelectedCell overwrites
        const currentSelections = uiState().selections;
        setSelections([
          ...ui.selections,
          currentSelections[currentSelections.length - 1],
        ]);
      } else {
        // Normal click
        setSelectedCell(pos);
        isDraggingRef.current = true;
        dragStartRef.current = pos;
      }
    },
    [gridState, uiState, screenToGrid, setSelectedCell, setSelections],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = screenToGrid(x, y);
      if (!pos) return;

      setSelections([{ start: dragStartRef.current, end: pos }]);
    },
    [screenToGrid, setSelections],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
  }, []);

  // Double-click → edit mode
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = screenToGrid(x, y);
      if (!pos) return;

      const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
      const cellData = cellState().getCell(activeSheetId, pos.row, pos.col);
      const currentValue =
        cellData?.value != null ? String(cellData.value) : "";
      startEditing(pos, currentValue);
    },
    [screenToGrid, cellState, startEditing],
  );

  // Edit commit handler
  const handleCommitEdit = useCallback(
    (value: string, direction: "down" | "right" | "none") => {
      const ui = uiState();
      if (!ui.editingCell) return;
      const activeSheetId = useSpreadsheetStore.getState().activeSheetId;

      if (value !== "") {
        useCellStore
          .getState()
          .setCell(activeSheetId, ui.editingCell.row, ui.editingCell.col, {
            value,
          });
      } else {
        useCellStore
          .getState()
          .deleteCell(activeSheetId, ui.editingCell.row, ui.editingCell.col);
      }

      const gs = gridState();
      const nextPos = { ...ui.editingCell };

      if (direction === "down") {
        nextPos.row = Math.min(ui.editingCell.row + 1, gs.totalRows - 1);
      } else if (direction === "right") {
        nextPos.col = Math.min(ui.editingCell.col + 1, gs.totalCols - 1);
      }

      commitEdit();
      setSelectedCell(nextPos);
    },
    [uiState, gridState, commitEdit, setSelectedCell],
  );

  const handleCancelEdit = useCallback(() => {
    cancelEdit();
  }, [cancelEdit]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ui = uiState();
      const gs = gridState();

      // If editing, let the CellEditor handle keys
      if (ui.isEditing) return;

      if (!ui.selectedCell) return;

      const { row, col } = ui.selectedCell;

      // Ctrl+A / Cmd+A → select all
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

      // Arrow keys
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newRow = Math.max(0, row - 1);
        setSelectedCell({ row: newRow, col });
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newRow = Math.min(gs.totalRows - 1, row + 1);
        setSelectedCell({ row: newRow, col });
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const newCol = Math.max(0, col - 1);
        setSelectedCell({ row, col: newCol });
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const newCol = Math.min(gs.totalCols - 1, col + 1);
        setSelectedCell({ row, col: newCol });
        return;
      }

      // Tab / Shift+Tab
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          const newCol = Math.max(0, col - 1);
          setSelectedCell({ row, col: newCol });
        } else {
          const newCol = Math.min(gs.totalCols - 1, col + 1);
          setSelectedCell({ row, col: newCol });
        }
        return;
      }

      // Enter / Shift+Enter
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          const newRow = Math.max(0, row - 1);
          setSelectedCell({ row: newRow, col });
        } else {
          const newRow = Math.min(gs.totalRows - 1, row + 1);
          setSelectedCell({ row: newRow, col });
        }
        return;
      }

      // F2 → edit mode
      if (e.key === "F2") {
        e.preventDefault();
        const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
        const cellData = cellState().getCell(activeSheetId, row, col);
        const currentValue =
          cellData?.value != null ? String(cellData.value) : "";
        startEditing({ row, col }, currentValue);
        return;
      }

      // Escape
      if (e.key === "Escape") {
        e.preventDefault();
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
        useCellStore.getState().deleteCell(activeSheetId, row, col);
        return;
      }

      // Printable character → start editing with that character
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startEditing({ row, col }, e.key);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    uiState,
    gridState,
    cellState,
    setSelectedCell,
    setSelections,
    startEditing,
  ]);

  const scrollDims = computeScrollDimensions();

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
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: containerSize.width,
          height: containerSize.height,
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
    </div>
  );
}
