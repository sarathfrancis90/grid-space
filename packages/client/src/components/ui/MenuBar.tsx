/**
 * MenuBar — File/Edit/View/Insert/Format/Data/Tools dropdown menus.
 * S7-009 to S7-015
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useHistoryStore } from "../../stores/historyStore";
import { useUIStore } from "../../stores/uiStore";
import { useClipboardStore } from "../../stores/clipboardStore";
import { useCellStore } from "../../stores/cellStore";
import { useGridStore } from "../../stores/gridStore";
import { useFormatStore } from "../../stores/formatStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useChartStore } from "../../stores/chartStore";

interface MenuItemDef {
  label: string;
  action?: () => void;
  shortcut?: string;
  separator?: boolean;
  testId: string;
  checked?: boolean;
}

interface MenuDef {
  label: string;
  testId: string;
  items: MenuItemDef[];
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const showGridlines = useUIStore((s) => s.showGridlines);
  const showFormulaBar = useUIStore((s) => s.showFormulaBar);

  const handleMenuClick = useCallback(
    (menu: string) => {
      setOpenMenu(openMenu === menu ? null : menu);
    },
    [openMenu],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const gatherClipboardData = () => {
    const ui = useUIStore.getState();
    if (ui.selections.length === 0) return null;
    const sel = ui.selections[ui.selections.length - 1];
    const sid = useSpreadsheetStore.getState().activeSheetId;
    const cells = useCellStore
      .getState()
      .getCellsInRangeWithKeys(
        sid,
        Math.min(sel.start.row, sel.end.row),
        Math.min(sel.start.col, sel.end.col),
        Math.max(sel.start.row, sel.end.row),
        Math.max(sel.start.col, sel.end.col),
      );
    return { cells, sel, sid };
  };

  const handlePaste = () => {
    const ui = useUIStore.getState();
    if (!ui.selectedCell) return;
    const sid = useSpreadsheetStore.getState().activeSheetId;
    const clipboard = useClipboardStore.getState();
    const { cells, mode, sourceRange } = clipboard.paste(ui.selectedCell);
    if (cells.size > 0) {
      useHistoryStore.getState().pushUndo();
      const cs = useCellStore.getState();
      for (const [key, cellData] of cells) {
        const [r, c] = key.split(",").map(Number);
        cs.setCell(sid, r, c, cellData);
      }
      if (mode === "cut" && sourceRange) {
        cs.clearRange(
          sid,
          Math.min(sourceRange.start.row, sourceRange.end.row),
          Math.min(sourceRange.start.col, sourceRange.end.col),
          Math.max(sourceRange.start.row, sourceRange.end.row),
          Math.max(sourceRange.start.col, sourceRange.end.col),
        );
        useClipboardStore.getState().clear();
      }
    }
  };

  const menus: MenuDef[] = [
    {
      label: "File",
      testId: "menu-file",
      items: [
        {
          label: "New",
          testId: "menu-file-new",
          action: () => setOpenMenu(null),
        },
        {
          label: "Open",
          testId: "menu-file-open",
          action: () => setOpenMenu(null),
        },
        {
          label: "Save",
          testId: "menu-file-save",
          shortcut: "Ctrl+S",
          action: () => setOpenMenu(null),
        },
        {
          label: "Download",
          testId: "menu-file-download",
          separator: true,
          action: () => setOpenMenu(null),
        },
        {
          label: "Print",
          testId: "menu-file-print",
          shortcut: "Ctrl+P",
          action: () => {
            useUIStore.getState().setPrintDialogOpen(true);
            setOpenMenu(null);
          },
        },
      ],
    },
    {
      label: "Edit",
      testId: "menu-edit",
      items: [
        {
          label: "Undo",
          testId: "menu-edit-undo",
          shortcut: "Ctrl+Z",
          action: () => {
            useHistoryStore.getState().undo();
            setOpenMenu(null);
          },
        },
        {
          label: "Redo",
          testId: "menu-edit-redo",
          shortcut: "Ctrl+Y",
          action: () => {
            useHistoryStore.getState().redo();
            setOpenMenu(null);
          },
        },
        {
          label: "Cut",
          testId: "menu-edit-cut",
          shortcut: "Ctrl+X",
          separator: true,
          action: () => {
            const data = gatherClipboardData();
            if (data) useClipboardStore.getState().cut(data.cells, data.sel);
            setOpenMenu(null);
          },
        },
        {
          label: "Copy",
          testId: "menu-edit-copy",
          shortcut: "Ctrl+C",
          action: () => {
            const data = gatherClipboardData();
            if (data) useClipboardStore.getState().copy(data.cells, data.sel);
            setOpenMenu(null);
          },
        },
        {
          label: "Paste",
          testId: "menu-edit-paste",
          shortcut: "Ctrl+V",
          action: () => {
            handlePaste();
            setOpenMenu(null);
          },
        },
        {
          label: "Find and Replace",
          testId: "menu-edit-find",
          shortcut: "Ctrl+H",
          action: () => setOpenMenu(null),
        },
      ],
    },
    {
      label: "View",
      testId: "menu-view",
      items: [
        {
          label: "Freeze rows",
          testId: "menu-view-freeze-rows",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) useGridStore.getState().setFrozenRows(sel.row);
            setOpenMenu(null);
          },
        },
        {
          label: "Freeze columns",
          testId: "menu-view-freeze-cols",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) useGridStore.getState().setFrozenCols(sel.col);
            setOpenMenu(null);
          },
        },
        {
          label: showGridlines ? "✓ Gridlines" : "  Gridlines",
          testId: "menu-view-gridlines",
          checked: showGridlines,
          action: () => {
            useUIStore.getState().setShowGridlines(!showGridlines);
            setOpenMenu(null);
          },
        },
        {
          label: showFormulaBar ? "✓ Formula bar" : "  Formula bar",
          testId: "menu-view-formula-bar",
          checked: showFormulaBar,
          action: () => {
            useUIStore.getState().setShowFormulaBar(!showFormulaBar);
            setOpenMenu(null);
          },
        },
        {
          label: "Zoom",
          testId: "menu-view-zoom",
          action: () => setOpenMenu(null),
        },
      ],
    },
    {
      label: "Insert",
      testId: "menu-insert",
      items: [
        {
          label: "Rows above",
          testId: "menu-insert-rows",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) {
              const gs = useGridStore.getState();
              useHistoryStore.getState().pushUndo();
              useCellStore
                .getState()
                .insertRows(
                  useSpreadsheetStore.getState().activeSheetId,
                  sel.row,
                  1,
                  gs.totalRows,
                );
              gs.setTotalRows(gs.totalRows + 1);
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Columns left",
          testId: "menu-insert-cols",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) {
              const gs = useGridStore.getState();
              useHistoryStore.getState().pushUndo();
              useCellStore
                .getState()
                .insertCols(
                  useSpreadsheetStore.getState().activeSheetId,
                  sel.col,
                  1,
                  gs.totalCols,
                );
              gs.setTotalCols(gs.totalCols + 1);
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Chart",
          testId: "menu-insert-chart",
          separator: true,
          action: () => {
            const sel = useUIStore.getState().selections[0];
            const sid = useSpreadsheetStore.getState().activeSheetId;
            if (sel && sid) {
              useChartStore
                .getState()
                .createChartFromSelection(sid, "column", sel);
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Image",
          testId: "menu-insert-image",
          action: () => {
            useUIStore.getState().setImageDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Link",
          testId: "menu-insert-link",
          shortcut: "Ctrl+K",
          action: () => {
            useUIStore.getState().setHyperlinkDialogOpen(true);
            setOpenMenu(null);
          },
        },
      ],
    },
    {
      label: "Format",
      testId: "menu-format",
      items: [
        {
          label: "Number",
          testId: "menu-format-number",
          action: () => {
            useUIStore.getState().setFormatCellsDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Text",
          testId: "menu-format-text",
          action: () => setOpenMenu(null),
        },
        {
          label: "Alignment",
          testId: "menu-format-alignment",
          action: () => setOpenMenu(null),
        },
        {
          label: "Borders",
          testId: "menu-format-borders",
          action: () => setOpenMenu(null),
        },
        {
          label: "Clear formatting",
          testId: "menu-format-clear",
          action: () => {
            useFormatStore.getState().clearFormattingOnSelection();
            setOpenMenu(null);
          },
        },
      ],
    },
    {
      label: "Data",
      testId: "menu-data",
      items: [
        {
          label: "Sort range",
          testId: "menu-data-sort",
          action: () => setOpenMenu(null),
        },
        {
          label: "Create filter",
          testId: "menu-data-filter",
          action: () => setOpenMenu(null),
        },
        {
          label: "Data validation",
          testId: "menu-data-validation",
          action: () => setOpenMenu(null),
        },
        {
          label: "Pivot table",
          testId: "menu-data-pivot",
          action: () => setOpenMenu(null),
        },
        {
          label: "Named ranges",
          testId: "menu-data-named-ranges",
          action: () => setOpenMenu(null),
        },
      ],
    },
    {
      label: "Tools",
      testId: "menu-tools",
      items: [
        {
          label: "Spelling",
          testId: "menu-tools-spelling",
          action: () => setOpenMenu(null),
        },
        {
          label: "Notifications",
          testId: "menu-tools-notifications",
          action: () => setOpenMenu(null),
        },
      ],
    },
  ];

  return (
    <div
      ref={menuRef}
      data-testid="menu-bar"
      className="flex items-center bg-white border-b border-gray-200 px-1"
    >
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            data-testid={menu.testId}
            className={`px-3 py-1 text-sm rounded hover:bg-gray-100 ${
              openMenu === menu.label ? "bg-gray-200" : ""
            }`}
            onClick={() => handleMenuClick(menu.label)}
            type="button"
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div
              data-testid={`${menu.testId}-dropdown`}
              className="absolute left-0 top-full z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-52"
            >
              {menu.items.map((item, idx) => (
                <div key={idx}>
                  {item.separator && idx > 0 && (
                    <div className="h-px bg-gray-200 my-1" />
                  )}
                  <button
                    data-testid={item.testId}
                    className="w-full flex items-center justify-between px-4 py-1.5 text-sm hover:bg-gray-100"
                    onClick={item.action}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-gray-400 text-xs ml-6">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
