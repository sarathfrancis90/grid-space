import { useState, useCallback, useRef } from "react";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";

const TAB_COLORS = [
  "#e53935",
  "#fb8c00",
  "#fdd835",
  "#43a047",
  "#1e88e5",
  "#8e24aa",
  "#6d4c41",
];

interface TabContextMenu {
  x: number;
  y: number;
  sheetId: string;
}

export function SheetTabs() {
  const sheets = useSpreadsheetStore((s) => s.sheets);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const setActiveSheet = useSpreadsheetStore((s) => s.setActiveSheet);
  const addSheet = useSpreadsheetStore((s) => s.addSheet);
  const removeSheet = useSpreadsheetStore((s) => s.removeSheet);
  const renameSheet = useSpreadsheetStore((s) => s.renameSheet);
  const duplicateSheet = useSpreadsheetStore((s) => s.duplicateSheet);
  const reorderSheet = useSpreadsheetStore((s) => s.reorderSheet);
  const setTabColor = useSpreadsheetStore((s) => s.setTabColor);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [contextMenu, setContextMenu] = useState<TabContextMenu | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTabClick = useCallback(
    (sheetId: string) => {
      if (editingTabId) return;
      setActiveSheet(sheetId);
      useCellStore.getState().ensureSheet(sheetId);
    },
    [setActiveSheet, editingTabId],
  );

  const handleDoubleClick = useCallback((sheetId: string, name: string) => {
    setEditingTabId(sheetId);
    setEditName(name);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const commitRename = useCallback(() => {
    if (editingTabId && editName.trim()) {
      renameSheet(editingTabId, editName.trim());
    }
    setEditingTabId(null);
  }, [editingTabId, editName, renameSheet]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, sheetId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, sheetId });
    },
    [],
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (toIdx: number) => {
      if (dragIdx !== null && dragIdx !== toIdx) {
        reorderSheet(dragIdx, toIdx);
      }
      setDragIdx(null);
    },
    [dragIdx, reorderSheet],
  );

  const handleDelete = useCallback(
    (sheetId: string) => {
      removeSheet(sheetId);
      setContextMenu(null);
    },
    [removeSheet],
  );

  const handleDuplicate = useCallback(
    (sheetId: string) => {
      duplicateSheet(sheetId);
      setContextMenu(null);
    },
    [duplicateSheet],
  );

  const handleSetColor = useCallback(
    (sheetId: string, color: string | undefined) => {
      setTabColor(sheetId, color);
      setContextMenu(null);
    },
    [setTabColor],
  );

  return (
    <div
      data-testid="sheet-tabs-container"
      className="flex items-center h-9 bg-[#f0f0f0] border-t border-gray-300 pl-2 overflow-hidden select-none"
      style={{ height: "36px", paddingLeft: "8px" }}
    >
      <button
        data-testid="add-sheet-btn"
        onClick={() => addSheet()}
        className="w-7 h-7 rounded hover:bg-gray-200 cursor-pointer text-lg text-gray-600 mr-1 flex items-center justify-center transition-colors"
        style={{ width: "28px", height: "28px", marginRight: "4px" }}
      >
        +
      </button>
      <div className="flex gap-px overflow-x-auto flex-1 items-end h-full">
        {sheets.map((sheet, idx) => (
          <div
            key={sheet.id}
            data-testid={`sheet-tab-${sheet.id}`}
            draggable={editingTabId !== sheet.id}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(idx)}
            onClick={() => handleTabClick(sheet.id)}
            onDoubleClick={() => handleDoubleClick(sheet.id, sheet.name)}
            onContextMenu={(e) => handleContextMenu(e, sheet.id)}
            className={`px-4 cursor-pointer text-xs whitespace-nowrap min-w-[60px] text-center transition-colors ${
              sheet.id === activeSheetId
                ? "bg-white text-gray-800 font-medium rounded-t border-l border-r border-t border-gray-300"
                : "bg-transparent text-gray-600 hover:bg-gray-200/60 rounded-t border border-transparent"
            }`}
            style={{
              padding: "6px 16px",
              borderBottom: sheet.tabColor
                ? `3px solid ${sheet.tabColor}`
                : sheet.id === activeSheetId
                  ? "none"
                  : "3px solid transparent",
              ...(sheet.id === activeSheetId
                ? {
                    borderTop: "3px solid #1a73e8",
                    backgroundColor: "#fff",
                    marginBottom: "-1px",
                    paddingBottom: "7px",
                  }
                : { borderTop: "3px solid transparent" }),
            }}
          >
            {editingTabId === sheet.id ? (
              <input
                ref={inputRef}
                data-testid="sheet-tab-rename-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingTabId(null);
                }}
                className="w-[60px] border-none outline-none text-xs text-center bg-transparent"
                autoFocus
              />
            ) : (
              sheet.name
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          data-testid="sheet-context-menu-backdrop"
          className="fixed top-0 left-0 w-screen h-screen z-[200]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            data-testid="sheet-context-menu"
            className="absolute bg-white border border-gray-300 rounded shadow-lg min-w-[160px] py-1 z-[201]"
            style={{
              left: contextMenu.x,
              bottom: window.innerHeight - contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              data-testid="ctx-rename"
              onClick={() => {
                const sheet = sheets.find((s) => s.id === contextMenu.sheetId);
                if (sheet) {
                  handleDoubleClick(sheet.id, sheet.name);
                }
                setContextMenu(null);
              }}
              className="px-4 py-1.5 cursor-pointer text-[13px] hover:bg-blue-50"
            >
              Rename
            </div>
            <div
              data-testid="ctx-duplicate"
              onClick={() => handleDuplicate(contextMenu.sheetId)}
              className="px-4 py-1.5 cursor-pointer text-[13px] hover:bg-blue-50"
            >
              Duplicate
            </div>
            <div
              data-testid="ctx-delete"
              onClick={() => handleDelete(contextMenu.sheetId)}
              className={`px-4 py-1.5 text-[13px] ${
                sheets.length <= 1
                  ? "cursor-default text-gray-400"
                  : "cursor-pointer text-gray-700 hover:bg-blue-50"
              }`}
            >
              Delete
            </div>
            <div className="h-px bg-gray-200 my-1" />
            <div className="px-4 py-1.5 text-xs text-gray-500">Tab color</div>
            <div className="flex gap-1 px-4 py-1 flex-wrap">
              {TAB_COLORS.map((color) => (
                <div
                  key={color}
                  data-testid={`tab-color-${color}`}
                  onClick={() => handleSetColor(contextMenu.sheetId, color)}
                  className="w-[18px] h-[18px] rounded-sm cursor-pointer border border-black/20"
                  style={{ background: color }}
                />
              ))}
              <div
                data-testid="tab-color-none"
                onClick={() => handleSetColor(contextMenu.sheetId, undefined)}
                className="w-[18px] h-[18px] rounded-sm cursor-pointer border border-gray-300 bg-white flex items-center justify-center text-[10px] text-gray-400"
              >
                X
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
