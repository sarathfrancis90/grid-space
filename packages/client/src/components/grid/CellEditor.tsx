import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useGridStore } from "../../stores/gridStore";

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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    [editValue, onCommit, onCancel],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value);
    },
    [setEditValue],
  );

  if (!isEditing || !editingCell) return null;

  const cellX = getColumnX(editingCell.col) - scrollLeft + rowHeaderWidth;
  const cellY = getRowY(editingCell.row) - scrollTop + colHeaderHeight;
  const cellWidth = getColumnWidth(editingCell.col);
  const cellHeight = getRowHeight(editingCell.row);

  return (
    <textarea
      ref={textareaRef}
      data-testid="cell-editor"
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
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
  );
}
