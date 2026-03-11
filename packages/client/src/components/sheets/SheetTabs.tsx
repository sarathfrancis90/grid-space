import { useState, useCallback, useRef, useEffect } from "react";
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
  const [allSheetsOpen, setAllSheetsOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const allSheetsRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const hasOverflow = container.scrollWidth > container.clientWidth;
    setShowLeftArrow(hasOverflow && container.scrollLeft > 1);
    setShowRightArrow(
      hasOverflow &&
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 1,
    );
  }, []);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;
    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(container);
    container.addEventListener("scroll", checkOverflow);
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", checkOverflow);
    };
  }, [checkOverflow, sheets.length]);

  const scrollTabs = useCallback((direction: "left" | "right") => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const scrollAmount = 150;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

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

  const openContextMenuFromDropdown = useCallback(
    (e: React.MouseEvent, sheetId: string) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setContextMenu({ x: rect.left, y: rect.top, sheetId });
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

  const handleAllSheetsSelect = useCallback(
    (sheetId: string) => {
      setActiveSheet(sheetId);
      useCellStore.getState().ensureSheet(sheetId);
      setAllSheetsOpen(false);
    },
    [setActiveSheet],
  );

  useEffect(() => {
    if (!allSheetsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        allSheetsRef.current &&
        !allSheetsRef.current.contains(e.target as Node)
      ) {
        setAllSheetsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [allSheetsOpen]);

  return (
    <div
      data-testid="sheet-tabs-container"
      className="flex items-center h-9 bg-[#f0f0f0] border-t border-gray-300 pl-2 select-none"
      style={{ height: "36px", paddingLeft: "8px" }}
    >
      {/* Add Sheet Button */}
      <button
        data-testid="add-sheet-btn"
        onClick={() => addSheet()}
        className="w-7 h-7 rounded hover:bg-gray-200 cursor-pointer text-lg text-gray-600 flex items-center justify-center transition-colors flex-shrink-0"
        style={{ width: "28px", height: "28px" }}
      >
        +
      </button>

      {/* All Sheets Hamburger Menu */}
      <div className="relative flex-shrink-0" ref={allSheetsRef}>
        <button
          data-testid="all-sheets-btn"
          onClick={() => setAllSheetsOpen((prev) => !prev)}
          className="w-7 h-7 rounded hover:bg-gray-200 cursor-pointer text-gray-600 flex items-center justify-center transition-colors mx-0.5"
          style={{ width: "28px", height: "28px" }}
          title="All sheets"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="3" y1="4" x2="13" y2="4" />
            <line x1="3" y1="8" x2="13" y2="8" />
            <line x1="3" y1="12" x2="13" y2="12" />
          </svg>
        </button>
        {allSheetsOpen && (
          <div
            data-testid="all-sheets-menu"
            className="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 rounded shadow-lg min-w-[160px] py-1 z-[300]"
          >
            {sheets.map((sheet) => (
              <div
                key={sheet.id}
                data-testid={`all-sheets-item-${sheet.id}`}
                onClick={() => handleAllSheetsSelect(sheet.id)}
                className={`px-4 py-1.5 cursor-pointer text-[13px] hover:bg-blue-50 flex items-center gap-2 ${
                  sheet.id === activeSheetId ? "bg-blue-50 font-medium" : ""
                }`}
              >
                {sheet.tabColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: sheet.tabColor }}
                  />
                )}
                <span className="truncate">{sheet.name}</span>
                {sheet.id === activeSheetId && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    className="ml-auto flex-shrink-0 text-blue-600"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Left Navigation Arrow */}
      {showLeftArrow && (
        <button
          data-testid="tabs-scroll-left"
          onClick={() => scrollTabs("left")}
          className="w-6 h-6 rounded hover:bg-gray-200 cursor-pointer text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M8 1L3 6l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={tabsContainerRef}
        className="flex gap-px overflow-x-auto flex-1 items-end h-full"
        style={{ scrollbarWidth: "none" }}
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
            className={`group px-4 cursor-pointer text-xs whitespace-nowrap min-w-[60px] text-center transition-colors flex items-center gap-0.5 ${
              sheet.id === activeSheetId
                ? "bg-white text-gray-800 font-medium rounded-t border-l border-r border-t border-gray-300"
                : "bg-transparent text-gray-600 hover:bg-gray-200/60 rounded-t border border-transparent"
            }`}
            style={{
              padding: "6px 12px 6px 16px",
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
              <>
                <span>{sheet.name}</span>
                {/* Tab Dropdown Triangle */}
                <span
                  data-testid={`sheet-tab-dropdown-${sheet.id}`}
                  onClick={(e) => openContextMenuFromDropdown(e, sheet.id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 flex-shrink-0"
                  style={{ fontSize: "8px", lineHeight: 1 }}
                >
                  ▼
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Right Navigation Arrow */}
      {showRightArrow && (
        <button
          data-testid="tabs-scroll-right"
          onClick={() => scrollTabs("right")}
          className="w-6 h-6 rounded hover:bg-gray-200 cursor-pointer text-gray-500 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M4 1l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>
      )}

      {/* Context Menu */}
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
