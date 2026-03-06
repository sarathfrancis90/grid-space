import { useEffect, useRef, useCallback, useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useGridStore } from "../../stores/gridStore";
import { useDataStore } from "../../stores/dataStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import {
  useSmartChipStore,
  getChipDisplayValue,
} from "../../stores/smartChipStore";
import { SmartChipMenu } from "./SmartChipMenu";
import { SmartChipEditor } from "./SmartChipEditors";
import type { SmartChip, SmartChipType } from "../../types/grid";

interface CellEditorProps {
  onCommit: (value: string, direction: "down" | "right" | "none") => void;
  onCancel: () => void;
}

export function CellEditor({ onCommit, onCancel }: CellEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editingCell = useUIStore((s) => s.editingCell);
  const editValue = useUIStore((s) => s.editValue);
  const setEditValue = useUIStore((s) => s.setEditValue);
  const isEditing = useUIStore((s) => s.isEditing);
  const getColumnWidth = useGridStore((s) => s.getColumnWidth);
  const getRowHeight = useGridStore((s) => s.getRowHeight);
  const getColumnX = useGridStore((s) => s.getColumnX);
  const getRowY = useGridStore((s) => s.getRowY);
  const scrollTop = useGridStore((s) => s.scrollTop);
  const scrollLeft = useGridStore((s) => s.scrollLeft);
  const rowHeaderWidth = useGridStore((s) => s.rowHeaderWidth);
  const colHeaderHeight = useGridStore((s) => s.colHeaderHeight);

  const openMenu = useSmartChipStore((s) => s.openMenu);
  const closeMenu = useSmartChipStore((s) => s.closeMenu);
  const isMenuOpen = useSmartChipStore((s) => s.menu.isMenuOpen);
  const setChip = useSmartChipStore((s) => s.setChip);
  const setCell = useCellStore((s) => s.setCell);
  const getCell = useCellStore((s) => s.getCell);

  const [editingChipType, setEditingChipType] = useState<SmartChipType | null>(
    null,
  );

  // Check cell protection
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const isCellProtected = editingCell
    ? useDataStore
        .getState()
        .isCellProtected(sheetId, editingCell.row, editingCell.col)
    : false;

  useEffect(() => {
    if (isEditing && isCellProtected) {
      // Cancel editing for protected cells
      onCancel();
      return;
    }
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing, isCellProtected, onCancel]);

  // Reset chip editor state when editing stops
  useEffect(() => {
    if (!isEditing) {
      setEditingChipType(null);
      closeMenu();
    }
  }, [isEditing, closeMenu]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isMenuOpen || editingChipType) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onCommit(editValue, "down");
      } else if (e.key === "Tab") {
        e.preventDefault();
        onCommit(editValue, "right");
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [editValue, onCommit, onCancel, isMenuOpen, editingChipType],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setEditValue(newValue);

      // Check for @ trigger
      if (newValue.endsWith("@") && editingCell) {
        const cellX = getColumnX(editingCell.col) - scrollLeft + rowHeaderWidth;
        const cellY = getRowY(editingCell.row) - scrollTop + colHeaderHeight;
        openMenu({ x: cellX, y: cellY });
      } else if (isMenuOpen && !newValue.includes("@")) {
        closeMenu();
      }
    },
    [
      setEditValue,
      editingCell,
      getColumnX,
      getRowY,
      scrollLeft,
      scrollTop,
      rowHeaderWidth,
      colHeaderHeight,
      openMenu,
      closeMenu,
      isMenuOpen,
    ],
  );

  const handleChipTypeSelect = useCallback(
    (chipType: SmartChipType) => {
      closeMenu();
      // Remove the @ from editValue
      const newValue = editValue.replace(/@$/, "");
      setEditValue(newValue);
      setEditingChipType(chipType);
    },
    [closeMenu, editValue, setEditValue],
  );

  const handleChipSave = useCallback(
    (chip: SmartChip) => {
      if (!editingCell) return;
      const displayValue = getChipDisplayValue(chip);
      // Set the chip on the store
      setChip(sheetId, editingCell.row, editingCell.col, chip);
      // Update cell with chip and display value
      const existingCell = getCell(sheetId, editingCell.row, editingCell.col);
      setCell(sheetId, editingCell.row, editingCell.col, {
        ...existingCell,
        value: displayValue,
        chip,
      });
      setEditingChipType(null);
      onCommit(displayValue, "none");
    },
    [editingCell, sheetId, setChip, setCell, getCell, onCommit],
  );

  const handleChipEditorCancel = useCallback(() => {
    setEditingChipType(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleMenuClose = useCallback(() => {
    closeMenu();
    // Remove the trailing @ when closing menu
    if (editValue.endsWith("@")) {
      setEditValue(editValue.slice(0, -1));
    }
  }, [closeMenu, editValue, setEditValue]);

  if (!isEditing || !editingCell) return null;

  const cellX = getColumnX(editingCell.col) - scrollLeft + rowHeaderWidth;
  const cellY = getRowY(editingCell.row) - scrollTop + colHeaderHeight;
  const cellWidth = getColumnWidth(editingCell.col);
  const cellHeight = getRowHeight(editingCell.row);

  return (
    <>
      <textarea
        ref={textareaRef}
        data-testid="cell-editor"
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck
        style={{
          position: "absolute",
          left: cellX,
          top: cellY,
          width: cellWidth,
          height: cellHeight,
          minWidth: cellWidth,
          minHeight: cellHeight,
          padding: "2px 4px",
          border: "2px solid #1a73e8",
          outline: "none",
          resize: "none",
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          lineHeight: `${cellHeight - 4}px`,
          boxSizing: "border-box",
          zIndex: 10,
          background: "white",
        }}
      />
      <SmartChipMenu
        onSelect={handleChipTypeSelect}
        onClose={handleMenuClose}
      />
      {editingChipType && (
        <SmartChipEditor
          chipType={editingChipType}
          position={{ x: cellX, y: cellY }}
          onSave={handleChipSave}
          onCancel={handleChipEditorCancel}
        />
      )}
    </>
  );
}
