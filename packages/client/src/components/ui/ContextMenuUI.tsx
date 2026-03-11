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
import { useNamedRangeStore } from "../../stores/namedRangeStore";
import { useFilterStore } from "../../stores/filterStore";
import { getCellKey, colToLetter } from "../../utils/coordinates";

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
  shortcut?: string;
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

  const handleInsertRowBelow = useCallback(() => {
    const gs = useGridStore.getState();
    useHistoryStore.getState().pushUndo();
    useCellStore
      .getState()
      .insertRows(sheetId, targetIndex + 1, 1, gs.totalRows);
    gs.setTotalRows(gs.totalRows + 1);
    onClose();
  }, [sheetId, targetIndex, onClose]);

  const handleInsertColRight = useCallback(() => {
    const gs = useGridStore.getState();
    useHistoryStore.getState().pushUndo();
    useCellStore
      .getState()
      .insertCols(sheetId, targetIndex + 1, 1, gs.totalCols);
    gs.setTotalCols(gs.totalCols + 1);
    onClose();
  }, [sheetId, targetIndex, onClose]);

  const handleInsertLink = useCallback(() => {
    useUIStore.getState().setHyperlinkDialogOpen(true);
    onClose();
  }, [onClose]);

  const handleDefineNamedRange = useCallback(() => {
    if (!selectedCell) return;
    const ui = useUIStore.getState();
    const selections = ui.selections;
    const lastSel =
      selections.length > 0 ? selections[selections.length - 1] : null;
    const startRow = lastSel
      ? Math.min(lastSel.start.row, lastSel.end.row)
      : selectedCell.row;
    const startCol = lastSel
      ? Math.min(lastSel.start.col, lastSel.end.col)
      : selectedCell.col;
    const endRow = lastSel
      ? Math.max(lastSel.start.row, lastSel.end.row)
      : selectedCell.row;
    const endCol = lastSel
      ? Math.max(lastSel.start.col, lastSel.end.col)
      : selectedCell.col;
    const rangeName = `Range_${colToLetter(startCol)}${startRow + 1}_${colToLetter(endCol)}${endRow + 1}`;
    useNamedRangeStore.getState().addRange({
      name: rangeName,
      sheetId,
      startRow,
      startCol,
      endRow,
      endCol,
    });
    onClose();
  }, [sheetId, selectedCell, onClose]);

  const handleProtectRange = useCallback(() => {
    useUIStore.getState().setProtectionDialogOpen(true);
    onClose();
  }, [onClose]);

  const handleGetCellLink = useCallback(() => {
    if (!selectedCell) return;
    const cellRef = `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`;
    const url = `${window.location.origin}${window.location.pathname}#cell=${cellRef}`;
    navigator.clipboard.writeText(url).catch(() => {
      window.prompt("Copy this link:", url);
    });
    onClose();
  }, [selectedCell, onClose]);

  const handleHideRow = useCallback(() => {
    if (!selectedCell) return;
    useGridStore.getState().hideRows([selectedCell.row]);
    onClose();
  }, [selectedCell, onClose]);

  const handleHideCol = useCallback(() => {
    if (!selectedCell) return;
    useGridStore.getState().hideCols([selectedCell.col]);
    onClose();
  }, [selectedCell, onClose]);

  const handleResizeRow = useCallback(() => {
    if (!selectedCell) return;
    const gs = useGridStore.getState();
    const input = window.prompt(
      "Enter row height (pixels):",
      String(gs.getRowHeight(selectedCell.row)),
    );
    if (input !== null) {
      const height = parseInt(input, 10);
      if (!isNaN(height) && height > 0) {
        gs.setRowHeight(selectedCell.row, height);
      }
    }
    onClose();
  }, [selectedCell, onClose]);

  const handleResizeCol = useCallback(() => {
    if (!selectedCell) return;
    const gs = useGridStore.getState();
    const input = window.prompt(
      "Enter column width (pixels):",
      String(gs.getColumnWidth(selectedCell.col)),
    );
    if (input !== null) {
      const width = parseInt(input, 10);
      if (!isNaN(width) && width > 0) {
        gs.setColumnWidth(selectedCell.col, width);
      }
    }
    onClose();
  }, [selectedCell, onClose]);

  const handleSortAZ = useCallback(() => {
    if (!selectedCell) return;
    useFilterStore
      .getState()
      .setSortCriteria(sheetId, [
        { col: selectedCell.col, direction: "asc" as const },
      ]);
    onClose();
  }, [sheetId, selectedCell, onClose]);

  const handleSortZA = useCallback(() => {
    if (!selectedCell) return;
    useFilterStore
      .getState()
      .setSortCriteria(sheetId, [
        { col: selectedCell.col, direction: "desc" as const },
      ]);
    onClose();
  }, [sheetId, selectedCell, onClose]);

  const handleCreateFilter = useCallback(() => {
    useFilterStore.getState().toggleFilters(sheetId);
    onClose();
  }, [sheetId, onClose]);

  const cellMenuItems: MenuItem[] = [
    { label: "Cut", action: handleCut, shortcut: "Ctrl+X", testId: "ctx-cut" },
    {
      label: "Copy",
      action: handleCopy,
      shortcut: "Ctrl+C",
      testId: "ctx-copy",
    },
    {
      label: "Paste",
      action: handlePaste,
      shortcut: "Ctrl+V",
      testId: "ctx-paste",
    },
    {
      label: "Clear contents",
      action: handleClearContents,
      shortcut: "Del",
      separator: true,
      testId: "ctx-clear",
    },
    {
      label: "Insert row above",
      action: handleInsertRow,
      testId: "ctx-insert-row",
    },
    {
      label: "Insert row below",
      action: handleInsertRowBelow,
      testId: "ctx-insert-row-below",
    },
    {
      label: "Insert column left",
      action: handleInsertCol,
      testId: "ctx-insert-col",
    },
    {
      label: "Insert column right",
      action: handleInsertColRight,
      testId: "ctx-insert-col-right",
    },
    {
      label: "Delete row",
      action: handleDeleteRow,
      testId: "ctx-delete-row",
    },
    {
      label: "Delete column",
      action: handleDeleteCol,
      separator: true,
      testId: "ctx-delete-col",
    },
    {
      label: "Hide row",
      action: handleHideRow,
      testId: "ctx-hide-row",
    },
    {
      label: "Hide column",
      action: handleHideCol,
      testId: "ctx-hide-col",
    },
    {
      label: "Resize row",
      action: handleResizeRow,
      testId: "ctx-resize-row",
    },
    {
      label: "Resize column",
      action: handleResizeCol,
      separator: true,
      testId: "ctx-resize-col",
    },
    {
      label: "Insert comment",
      action: handleAddComment,
      testId: "ctx-add-comment",
    },
    {
      label: "Insert link",
      action: handleInsertLink,
      testId: "ctx-insert-link",
    },
    {
      label: "Get link to this cell",
      action: handleGetCellLink,
      separator: true,
      testId: "ctx-get-cell-link",
    },
    {
      label: "Define named range",
      action: handleDefineNamedRange,
      testId: "ctx-define-named-range",
    },
    {
      label: "Protect range",
      action: handleProtectRange,
      separator: true,
      testId: "ctx-protect-range",
    },
    {
      label: "Sort sheet A → Z",
      action: handleSortAZ,
      testId: "ctx-sort-az",
    },
    {
      label: "Sort sheet Z → A",
      action: handleSortZA,
      testId: "ctx-sort-za",
    },
    {
      label: "Create filter",
      action: handleCreateFilter,
      testId: "ctx-create-filter",
    },
  ];

  const rowMenuItems: MenuItem[] = [
    { label: "Cut", action: handleCut, shortcut: "Ctrl+X", testId: "ctx-cut" },
    {
      label: "Copy",
      action: handleCopy,
      shortcut: "Ctrl+C",
      testId: "ctx-copy",
    },
    {
      label: "Paste",
      action: handlePaste,
      shortcut: "Ctrl+V",
      testId: "ctx-paste",
    },
    {
      label: "Insert row above",
      action: handleInsertRow,
      separator: true,
      testId: "ctx-insert-row",
    },
    {
      label: "Insert row below",
      action: handleInsertRowBelow,
      testId: "ctx-insert-row-below",
    },
    { label: "Delete row", action: handleDeleteRow, testId: "ctx-delete-row" },
    {
      label: "Hide row",
      action: () => {
        useGridStore.getState().hideRows([targetIndex]);
        onClose();
      },
      separator: true,
      testId: "ctx-hide-row",
    },
    {
      label: "Resize row",
      action: () => {
        const gs = useGridStore.getState();
        const input = window.prompt(
          "Enter row height (pixels):",
          String(gs.getRowHeight(targetIndex)),
        );
        if (input !== null) {
          const height = parseInt(input, 10);
          if (!isNaN(height) && height > 0) {
            gs.setRowHeight(targetIndex, height);
          }
        }
        onClose();
      },
      separator: true,
      testId: "ctx-resize-row",
    },
    {
      label: "Protect range",
      action: handleProtectRange,
      testId: "ctx-protect-range",
    },
  ];

  const colMenuItems: MenuItem[] = [
    { label: "Cut", action: handleCut, shortcut: "Ctrl+X", testId: "ctx-cut" },
    {
      label: "Copy",
      action: handleCopy,
      shortcut: "Ctrl+C",
      testId: "ctx-copy",
    },
    {
      label: "Paste",
      action: handlePaste,
      shortcut: "Ctrl+V",
      testId: "ctx-paste",
    },
    {
      label: "Insert column left",
      action: handleInsertCol,
      separator: true,
      testId: "ctx-insert-col",
    },
    {
      label: "Insert column right",
      action: handleInsertColRight,
      testId: "ctx-insert-col-right",
    },
    {
      label: "Delete column",
      action: handleDeleteCol,
      testId: "ctx-delete-col",
    },
    {
      label: "Hide column",
      action: () => {
        useGridStore.getState().hideCols([targetIndex]);
        onClose();
      },
      separator: true,
      testId: "ctx-hide-col",
    },
    {
      label: "Resize column",
      action: () => {
        const gs = useGridStore.getState();
        const input = window.prompt(
          "Enter column width (pixels):",
          String(gs.getColumnWidth(targetIndex)),
        );
        if (input !== null) {
          const width = parseInt(input, 10);
          if (!isNaN(width) && width > 0) {
            gs.setColumnWidth(targetIndex, width);
          }
        }
        onClose();
      },
      separator: true,
      testId: "ctx-resize-col",
    },
    {
      label: "Sort sheet A → Z",
      action: () => {
        useFilterStore
          .getState()
          .setSortCriteria(sheetId, [
            { col: targetIndex, direction: "asc" as const },
          ]);
        onClose();
      },
      testId: "ctx-sort-az",
    },
    {
      label: "Sort sheet Z → A",
      action: () => {
        useFilterStore
          .getState()
          .setSortCriteria(sheetId, [
            { col: targetIndex, direction: "desc" as const },
          ]);
        onClose();
      },
      separator: true,
      testId: "ctx-sort-za",
    },
    {
      label: "Protect range",
      action: handleProtectRange,
      testId: "ctx-protect-range",
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
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-52"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.separator && idx > 0 && (
            <div className="h-px bg-gray-100 my-1 mx-3" />
          )}
          <button
            data-testid={item.testId}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-gray-900 transition-colors"
            style={{ padding: "6px 16px" }}
            onClick={item.action}
            type="button"
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-gray-400 text-[11px] ml-8 font-mono">
                {item.shortcut}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
