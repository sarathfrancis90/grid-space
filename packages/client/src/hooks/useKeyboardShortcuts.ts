/**
 * useKeyboardShortcuts — central keyboard shortcut handler for GridSpace.
 * Attaches a single keydown listener on document and dispatches to the
 * appropriate store actions.  Disabled when a modal dialog is open.
 */
import { useEffect, useCallback } from "react";
import { useUIStore } from "../stores/uiStore";
import { useFormatStore } from "../stores/formatStore";
import { useHistoryStore } from "../stores/historyStore";
import { useClipboardStore } from "../stores/clipboardStore";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useFindReplaceStore } from "../stores/findReplaceStore";
import { getCellKey } from "../utils/coordinates";

export interface ShortcutHandlers {
  onPrint?: () => void;
  onFormatCellsDialog?: () => void;
  onPasteSpecial?: () => void;
}

const NUMBER_FORMAT_MAP: Record<string, string> = {
  "1": "#,##0.00", // Number
  "2": "h:mm:ss AM/PM", // Time
  "3": "M/d/yyyy", // Date
  "4": "$#,##0.00", // Currency
  "5": "0.00%", // Percent
  "6": "0.00E+00", // Scientific
};

export function useKeyboardShortcuts(handlers?: ShortcutHandlers): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const key = e.key;

      // Ignore when inside input/textarea elements that aren't the cell editor
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const isCellEditor = target.getAttribute("data-testid") === "cell-editor";

      const ui = useUIStore.getState();

      // F2 — enter edit mode
      if (key === "F2" && !ui.isEditing) {
        e.preventDefault();
        if (ui.selectedCell) {
          const sheetId = useSpreadsheetStore.getState().activeSheetId;
          const cell = useCellStore
            .getState()
            .getCell(sheetId, ui.selectedCell.row, ui.selectedCell.col);
          const initialValue = cell?.formula
            ? `=${cell.formula}`
            : String(cell?.value ?? "");
          ui.startEditing(ui.selectedCell, initialValue);
        }
        return;
      }

      // Alt+Enter — newline in cell (only when editing)
      if (alt && key === "Enter" && ui.isEditing) {
        e.preventDefault();
        ui.setEditValue(ui.editValue + "\n");
        return;
      }

      // Ctrl+; — insert current date
      if (ctrl && key === ";") {
        e.preventDefault();
        const sheetId = useSpreadsheetStore.getState().activeSheetId;
        const pos = ui.selectedCell;
        if (pos && sheetId) {
          useHistoryStore.getState().pushUndo();
          const today = new Date();
          const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
          const existing = useCellStore
            .getState()
            .getCell(sheetId, pos.row, pos.col);
          useCellStore.getState().setCell(sheetId, pos.row, pos.col, {
            value: dateStr,
            formula: existing?.formula,
            format: existing?.format,
            comment: existing?.comment,
          });
        }
        return;
      }

      // Skip most shortcuts when editing in non-cell inputs
      if (inInput && !isCellEditor && ctrl) {
        // Allow Ctrl+Z/Y even when in other inputs
        if (key === "z" || key === "y") {
          // Let the browser handle undo/redo in other inputs
          return;
        }
      }

      if (!ctrl && !alt) return;

      // --- Ctrl+<key> shortcuts ---
      if (ctrl && !shift && !alt) {
        switch (key.toLowerCase()) {
          case "b": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().toggleFormatOnSelection("bold");
            return;
          }
          case "i": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().toggleFormatOnSelection("italic");
            return;
          }
          case "u": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().toggleFormatOnSelection("underline");
            return;
          }
          case "z": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            useHistoryStore.getState().undo();
            return;
          }
          case "y": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            useHistoryStore.getState().redo();
            return;
          }
          case "c": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            performCopy();
            return;
          }
          case "x": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            performCut();
            return;
          }
          case "v": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            performPaste();
            return;
          }
          case "f": {
            e.preventDefault();
            useFindReplaceStore.getState().open(false);
            return;
          }
          case "h": {
            e.preventDefault();
            useFindReplaceStore.getState().open(true);
            return;
          }
          case "p": {
            e.preventDefault();
            handlers?.onPrint?.();
            return;
          }
          case "\\": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().clearFormattingOnSelection();
            return;
          }
          case "5": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().toggleFormatOnSelection("strikethrough");
            return;
          }
          case "1": {
            e.preventDefault();
            handlers?.onFormatCellsDialog?.();
            return;
          }
          case "=":
          case "+": {
            e.preventDefault();
            useUIStore
              .getState()
              .setZoom(Math.min((useUIStore.getState().zoom ?? 100) + 10, 200));
            return;
          }
          case "-": {
            e.preventDefault();
            useUIStore
              .getState()
              .setZoom(Math.max((useUIStore.getState().zoom ?? 100) - 10, 50));
            return;
          }
        }
      }

      // --- Ctrl+Shift+<key> shortcuts ---
      if (ctrl && shift && !alt) {
        switch (key) {
          case "Z": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            useHistoryStore.getState().redo();
            return;
          }
          case "V": {
            if (inInput && !isCellEditor) return;
            e.preventDefault();
            handlers?.onPasteSpecial?.();
            return;
          }
          case "!":
          case "1": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().setFormatOnSelection({
              numberFormat: NUMBER_FORMAT_MAP["1"],
            });
            return;
          }
          case "@":
          case "2": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().setFormatOnSelection({
              numberFormat: NUMBER_FORMAT_MAP["2"],
            });
            return;
          }
          case "#":
          case "3": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().setFormatOnSelection({
              numberFormat: NUMBER_FORMAT_MAP["3"],
            });
            return;
          }
          case "$":
          case "4": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().setFormatOnSelection({
              numberFormat: NUMBER_FORMAT_MAP["4"],
            });
            return;
          }
          case "%":
          case "5": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().setFormatOnSelection({
              numberFormat: NUMBER_FORMAT_MAP["5"],
            });
            return;
          }
          case "^":
          case "6": {
            e.preventDefault();
            useHistoryStore.getState().pushUndo();
            useFormatStore.getState().setFormatOnSelection({
              numberFormat: NUMBER_FORMAT_MAP["6"],
            });
            return;
          }
        }
      }
    },
    [handlers],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

function performCopy(): void {
  const ui = useUIStore.getState();
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  if (!sheetId || ui.selections.length === 0) return;

  const sel = ui.selections[ui.selections.length - 1];
  const cells = useCellStore
    .getState()
    .getCellsInRangeWithKeys(
      sheetId,
      sel.start.row,
      sel.start.col,
      sel.end.row,
      sel.end.col,
    );
  useClipboardStore.getState().copy(cells, sel);
}

function performCut(): void {
  const ui = useUIStore.getState();
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  if (!sheetId || ui.selections.length === 0) return;

  const sel = ui.selections[ui.selections.length - 1];
  const cells = useCellStore
    .getState()
    .getCellsInRangeWithKeys(
      sheetId,
      sel.start.row,
      sel.start.col,
      sel.end.row,
      sel.end.col,
    );
  useClipboardStore.getState().cut(cells, sel);
}

function performPaste(): void {
  const ui = useUIStore.getState();
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  if (!sheetId || !ui.selectedCell) return;

  useHistoryStore.getState().pushUndo();
  const result = useClipboardStore.getState().paste(ui.selectedCell);
  if (result.cells.size === 0) return;

  const cellStore = useCellStore.getState();
  for (const [key, data] of result.cells) {
    const [r, c] = key.split(",").map(Number);
    cellStore.setCell(sheetId, r, c, data);
  }

  // If cut, clear source cells
  if (result.mode === "cut" && result.sourceRange) {
    cellStore.clearRange(
      sheetId,
      result.sourceRange.start.row,
      result.sourceRange.start.col,
      result.sourceRange.end.row,
      result.sourceRange.end.col,
    );
    useClipboardStore.getState().clear();
  }
}

export type PasteSpecialMode = "values" | "format" | "formula";

export function performPasteSpecial(mode: PasteSpecialMode): void {
  const ui = useUIStore.getState();
  const sheetId = useSpreadsheetStore.getState().activeSheetId;
  if (!sheetId || !ui.selectedCell) return;

  const clipState = useClipboardStore.getState();
  if (!clipState.sourceRange || clipState.mode === null) return;

  useHistoryStore.getState().pushUndo();

  const minRow = Math.min(
    clipState.sourceRange.start.row,
    clipState.sourceRange.end.row,
  );
  const minCol = Math.min(
    clipState.sourceRange.start.col,
    clipState.sourceRange.end.col,
  );

  const cellStore = useCellStore.getState();

  for (const [key, srcData] of clipState.cells) {
    const [r, c] = key.split(",").map(Number);
    const newRow = r - minRow + ui.selectedCell.row;
    const newCol = c - minCol + ui.selectedCell.col;
    const targetKey = getCellKey(newRow, newCol);
    void targetKey;

    const existing = cellStore.getCell(sheetId, newRow, newCol);

    switch (mode) {
      case "values":
        cellStore.setCell(sheetId, newRow, newCol, {
          value: srcData.value,
          format: existing?.format,
          comment: existing?.comment,
        });
        break;
      case "format":
        cellStore.setCell(sheetId, newRow, newCol, {
          value: existing?.value ?? null,
          formula: existing?.formula,
          format: srcData.format,
          comment: existing?.comment,
        });
        break;
      case "formula":
        cellStore.setCell(sheetId, newRow, newCol, {
          value: srcData.formula ? srcData.value : srcData.value,
          formula: srcData.formula,
          format: existing?.format,
          comment: existing?.comment,
        });
        break;
    }
  }
}
