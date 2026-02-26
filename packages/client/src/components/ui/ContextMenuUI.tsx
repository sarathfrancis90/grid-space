/**
 * ContextMenuUI — right-click context menus for cell, row header, column header.
 * S7-006 to S7-008
 */
import { useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useGridStore } from "../../stores/gridStore";
import { useClipboardStore } from "../../stores/clipboardStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useCommentStore } from "../../stores/commentStore";
import { getCellKey } from "../../utils/coordinates";

interface ContextMenuUIProps {
  x: number;
  y: number;
  target: "cell" | "row" | "col";
  targetIndex: number;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
  testId: string;
}

export function ContextMenuUI({
  x,
  y,
  target,
  targetIndex,
  onClose,
}: ContextMenuUIProps) {
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  const selectedCell = useUIStore.getState().selectedCell;

  const gatherSelectedCells = useCallback(() => {
    const ui = useUIStore.getState();
    if (ui.selections.length === 0) return null;
    const sel = ui.selections[ui.selections.length - 1];
    const minRow = Math.min(sel.start.row, sel.end.row);
    const maxRow = Math.max(sel.start.row, sel.end.row);
    const minCol = Math.min(sel.start.col, sel.end.col);
    const maxCol = Math.max(sel.start.col, sel.end.col);
    const cells = useCellStore
      .getState()
      .getCellsInRangeWithKeys(sheetId, minRow, minCol, maxRow, maxCol);
    return { cells, sel };
  }, [sheetId]);

  const handleCut = useCallback(() => {
    const data = gatherSelectedCells();
    if (data) useClipboardStore.getState().cut(data.cells, data.sel);
    onClose();
  }, [onClose, gatherSelectedCells]);

  const handleCopy = useCallback(() => {
    const data = gatherSelectedCells();
    if (data) useClipboardStore.getState().copy(data.cells, data.sel);
    onClose();
  }, [onClose, gatherSelectedCells]);

  const handlePaste = useCallback(() => {
    if (!selectedCell) {
      onClose();
      return;
    }
    const clipboard = useClipboardStore.getState();
    const { cells, mode, sourceRange } = clipboard.paste(selectedCell);
    if (cells.size > 0) {
      useHistoryStore.getState().pushUndo();
      const cs = useCellStore.getState();
      for (const [key, cellData] of cells) {
        const [r, c] = key.split(",").map(Number);
        cs.setCell(sheetId, r, c, cellData);
      }
      if (mode === "cut" && sourceRange) {
        cs.clearRange(
          sheetId,
          Math.min(sourceRange.start.row, sourceRange.end.row),
          Math.min(sourceRange.start.col, sourceRange.end.col),
          Math.max(sourceRange.start.row, sourceRange.end.row),
          Math.max(sourceRange.start.col, sourceRange.end.col),
        );
        useClipboardStore.getState().clear();
      }
    }
    onClose();
  }, [onClose, selectedCell, sheetId]);

  const handleInsertRow = useCallback(() => {
    const gs = useGridStore.getState();
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().insertRows(sheetId, targetIndex, 1, gs.totalRows);
    gs.setTotalRows(gs.totalRows + 1);
    onClose();
  }, [sheetId, targetIndex, onClose]);

  const handleDeleteRow = useCallback(() => {
    const gs = useGridStore.getState();
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().deleteRows(sheetId, [targetIndex], gs.totalRows);
    gs.setTotalRows(gs.totalRows - 1);
    onClose();
  }, [sheetId, targetIndex, onClose]);

  const handleInsertCol = useCallback(() => {
    const gs = useGridStore.getState();
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().insertCols(sheetId, targetIndex, 1, gs.totalCols);
    gs.setTotalCols(gs.totalCols + 1);
    onClose();
  }, [sheetId, targetIndex, onClose]);

  const handleDeleteCol = useCallback(() => {
    const gs = useGridStore.getState();
    useHistoryStore.getState().pushUndo();
    useCellStore.getState().deleteCols(sheetId, [targetIndex], gs.totalCols);
    gs.setTotalCols(gs.totalCols - 1);
    onClose();
  }, [sheetId, targetIndex, onClose]);

  const handleClearContents = useCallback(() => {
    if (!selectedCell) return;
    useHistoryStore.getState().pushUndo();
    useCellStore
      .getState()
      .deleteCell(sheetId, selectedCell.row, selectedCell.col);
    onClose();
  }, [sheetId, selectedCell, onClose]);

  const handleAddComment = useCallback(() => {
    if (!selectedCell) return;
    const cellKey = getCellKey(selectedCell.row, selectedCell.col);
    useCommentStore.getState().setActiveCommentCell(sheetId, cellKey);
    onClose();
  }, [sheetId, selectedCell, onClose]);

  const cellMenuItems: MenuItem[] = [
    { label: "Cut", action: handleCut, testId: "ctx-cut" },
    { label: "Copy", action: handleCopy, testId: "ctx-copy" },
    { label: "Paste", action: handlePaste, testId: "ctx-paste" },
    {
      label: "Clear contents",
      action: handleClearContents,
      separator: true,
      testId: "ctx-clear",
    },
    {
      label: "Insert row above",
      action: handleInsertRow,
      testId: "ctx-insert-row",
    },
    {
      label: "Insert column left",
      action: handleInsertCol,
      testId: "ctx-insert-col",
    },
    {
      label: "Add comment",
      action: handleAddComment,
      testId: "ctx-add-comment",
    },
  ];

  const rowMenuItems: MenuItem[] = [
    { label: "Cut", action: handleCut, testId: "ctx-cut" },
    { label: "Copy", action: handleCopy, testId: "ctx-copy" },
    { label: "Paste", action: handlePaste, testId: "ctx-paste" },
    {
      label: "Insert row above",
      action: handleInsertRow,
      separator: true,
      testId: "ctx-insert-row",
    },
    {
      label: "Insert row below",
      action: () => {
        const gs = useGridStore.getState();
        useHistoryStore.getState().pushUndo();
        useCellStore
          .getState()
          .insertRows(sheetId, targetIndex + 1, 1, gs.totalRows);
        gs.setTotalRows(gs.totalRows + 1);
        onClose();
      },
      testId: "ctx-insert-row-below",
    },
    { label: "Delete row", action: handleDeleteRow, testId: "ctx-delete-row" },
  ];

  const colMenuItems: MenuItem[] = [
    { label: "Cut", action: handleCut, testId: "ctx-cut" },
    { label: "Copy", action: handleCopy, testId: "ctx-copy" },
    { label: "Paste", action: handlePaste, testId: "ctx-paste" },
    {
      label: "Insert column left",
      action: handleInsertCol,
      separator: true,
      testId: "ctx-insert-col",
    },
    {
      label: "Insert column right",
      action: () => {
        const gs = useGridStore.getState();
        useHistoryStore.getState().pushUndo();
        useCellStore
          .getState()
          .insertCols(sheetId, targetIndex + 1, 1, gs.totalCols);
        gs.setTotalCols(gs.totalCols + 1);
        onClose();
      },
      testId: "ctx-insert-col-right",
    },
    {
      label: "Delete column",
      action: handleDeleteCol,
      testId: "ctx-delete-col",
    },
  ];

  const items =
    target === "row"
      ? rowMenuItems
      : target === "col"
        ? colMenuItems
        : cellMenuItems;

  return (
    <div
      data-testid={`context-menu-${target}`}
      className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.separator && idx > 0 && (
            <div className="h-px bg-gray-200 my-1" />
          )}
          <button
            data-testid={item.testId}
            className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100"
            onClick={item.action}
            type="button"
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
