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
      style={{
        display: "flex",
        alignItems: "center",
        height: 32,
        background: "#f0f0f0",
        borderTop: "1px solid #ccc",
        paddingLeft: 4,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <button
        data-testid="add-sheet-btn"
        onClick={() => addSheet()}
        style={{
          width: 28,
          height: 28,
          border: "1px solid #ccc",
          borderRadius: 4,
          background: "white",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: "28px",
          marginRight: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        +
      </button>
      <div
        style={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          flex: 1,
        }}
      >
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
            style={{
              padding: "4px 12px",
              background: sheet.id === activeSheetId ? "white" : "#e8e8e8",
              borderTop:
                sheet.id === activeSheetId
                  ? "2px solid #1a73e8"
                  : "2px solid transparent",
              borderBottom: sheet.tabColor
                ? `3px solid ${sheet.tabColor}`
                : "3px solid transparent",
              borderLeft: "1px solid #ccc",
              borderRight: "1px solid #ccc",
              cursor: "pointer",
              fontSize: 12,
              whiteSpace: "nowrap",
              minWidth: 60,
              textAlign: "center",
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
                style={{
                  width: 60,
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  textAlign: "center",
                  background: "transparent",
                }}
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
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 200,
          }}
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            data-testid="sheet-context-menu"
            style={{
              position: "absolute",
              left: contextMenu.x,
              top: contextMenu.y - 180,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              minWidth: 160,
              padding: "4px 0",
              zIndex: 201,
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
              style={{ padding: "6px 16px", cursor: "pointer", fontSize: 13 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#e8f0fe";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              Rename
            </div>
            <div
              data-testid="ctx-duplicate"
              onClick={() => handleDuplicate(contextMenu.sheetId)}
              style={{ padding: "6px 16px", cursor: "pointer", fontSize: 13 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#e8f0fe";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              Duplicate
            </div>
            <div
              data-testid="ctx-delete"
              onClick={() => handleDelete(contextMenu.sheetId)}
              style={{
                padding: "6px 16px",
                cursor: sheets.length <= 1 ? "default" : "pointer",
                fontSize: 13,
                color: sheets.length <= 1 ? "#999" : "#333",
              }}
              onMouseEnter={(e) => {
                if (sheets.length > 1) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "#e8f0fe";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              Delete
            </div>
            <div
              style={{ height: 1, background: "#e2e2e2", margin: "4px 0" }}
            />
            <div
              style={{
                padding: "6px 16px",
                fontSize: 12,
                color: "#666",
              }}
            >
              Tab color
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "4px 16px",
                flexWrap: "wrap",
              }}
            >
              {TAB_COLORS.map((color) => (
                <div
                  key={color}
                  data-testid={`tab-color-${color}`}
                  onClick={() => handleSetColor(contextMenu.sheetId, color)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    background: color,
                    cursor: "pointer",
                    border: "1px solid rgba(0,0,0,0.2)",
                  }}
                />
              ))}
              <div
                data-testid="tab-color-none"
                onClick={() => handleSetColor(contextMenu.sheetId, undefined)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 3,
                  background: "white",
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#999",
                }}
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
