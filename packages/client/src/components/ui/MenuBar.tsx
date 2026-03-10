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
import { useMacroStore } from "../../stores/macroStore";
import { useCloudStore } from "../../stores/cloudStore";
import { useVersionStore } from "../../stores/versionStore";
import { useCommentStore } from "../../stores/commentStore";
import { useValidationStore } from "../../stores/validationStore";
import { useSuggestionsStore } from "../../stores/suggestionsStore";
import { exportXLSX, downloadFile, toCSV } from "../../utils/fileOps";
import { exportToPDF } from "../../utils/pdfExport";
import { performPasteSpecial } from "../../hooks/useKeyboardShortcuts";

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
  const showFormulas = useGridStore((s) => s.showFormulas);
  const macroIsRecording = useMacroStore((s) => s.isRecording);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
          label: "Import",
          testId: "menu-file-import",
          action: () => {
            useUIStore.getState().setImportDialogOpen(true);
            setOpenMenu(null);
          },
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
          label: "Download as CSV",
          testId: "menu-file-download-csv",
          action: () => {
            const sid = useSpreadsheetStore.getState().activeSheetId;
            const cells = useCellStore.getState().cells.get(sid) ?? new Map();
            const csvString = toCSV(cells);
            downloadFile(csvString, "spreadsheet.csv", "text/csv");
            setOpenMenu(null);
          },
        },
        {
          label: "Download as XLSX",
          testId: "menu-file-download-xlsx",
          action: () => {
            const sid = useSpreadsheetStore.getState().activeSheetId;
            const sheets = useSpreadsheetStore.getState().sheets;
            const cellStore = useCellStore.getState();
            const sheetsData = sheets.map((s) => ({
              name: s.name,
              cells: cellStore.cells.get(s.id) ?? new Map(),
            }));
            exportXLSX(sheetsData).then((buf) => {
              downloadFile(
                buf,
                "spreadsheet.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              );
            });
            void sid;
            setOpenMenu(null);
          },
        },
        {
          label: "Download as ODS",
          testId: "menu-file-download-ods",
          action: () => {
            const sheets = useSpreadsheetStore.getState().sheets;
            const cellStore = useCellStore.getState();
            const sheetsData = sheets.map((s) => ({
              name: s.name,
              cells: cellStore.cells.get(s.id) ?? new Map(),
            }));
            import("../../utils/fileOps").then(
              ({ exportODS, downloadFile: dl }) => {
                exportODS(sheetsData).then((buf) => {
                  dl(
                    buf,
                    "spreadsheet.ods",
                    "application/vnd.oasis.opendocument.spreadsheet",
                  );
                });
              },
            );
            setOpenMenu(null);
          },
        },
        {
          label: "Download as PDF",
          testId: "menu-file-download-pdf",
          action: () => {
            const sid = useSpreadsheetStore.getState().activeSheetId;
            const cells = useCellStore.getState().cells.get(sid) ?? new Map();
            exportToPDF(cells, { title: "Spreadsheet" });
            setOpenMenu(null);
          },
        },
        {
          label: "Download as CSV",
          testId: "menu-file-download-csv",
          action: () => {
            const sid = useSpreadsheetStore.getState().activeSheetId;
            const cells = useCellStore.getState().cells.get(sid) ?? new Map();
            const csvString = toCSV(cells);
            downloadFile(csvString, "spreadsheet.csv", "text/csv");
            setOpenMenu(null);
          },
        },
        {
          label: "Print",
          testId: "menu-file-print",
          shortcut: "Ctrl+P",
          separator: true,
          action: () => {
            useUIStore.getState().setPrintDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Version history",
          testId: "menu-file-version-history",
          shortcut: "Ctrl+Alt+Shift+H",
          separator: true,
          action: () => {
            const spreadsheetId =
              useCloudStore.getState().currentSpreadsheet?.id;
            if (spreadsheetId) {
              useVersionStore.getState().open(spreadsheetId);
            }
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
          label: "Paste values only",
          testId: "menu-edit-paste-values",
          shortcut: "Ctrl+Shift+V",
          action: () => {
            performPasteSpecial("values");
            setOpenMenu(null);
          },
        },
        {
          label: "Paste format only",
          testId: "menu-edit-paste-format",
          action: () => {
            performPasteSpecial("format");
            setOpenMenu(null);
          },
        },
        {
          label: "Paste transposed",
          testId: "menu-edit-paste-transpose",
          action: () => {
            performPasteSpecial({ mode: "values", transpose: true });
            setOpenMenu(null);
          },
        },
        {
          label: "Select all",
          testId: "menu-edit-select-all",
          shortcut: "Ctrl+A",
          separator: true,
          action: () => {
            const gs = useGridStore.getState();
            useUIStore.getState().setSelectedCell({ row: 0, col: 0 });
            useUIStore.getState().setSelections([
              {
                start: { row: 0, col: 0 },
                end: { row: gs.totalRows - 1, col: gs.totalCols - 1 },
              },
            ]);
            setOpenMenu(null);
          },
        },
        {
          label: "Delete values",
          testId: "menu-edit-delete-values",
          shortcut: "Delete",
          separator: true,
          action: () => {
            const ui = useUIStore.getState();
            const sid = useSpreadsheetStore.getState().activeSheetId;
            if (ui.selections.length > 0) {
              const sel = ui.selections[ui.selections.length - 1];
              useHistoryStore.getState().pushUndo();
              useCellStore
                .getState()
                .clearRange(
                  sid,
                  Math.min(sel.start.row, sel.end.row),
                  Math.min(sel.start.col, sel.end.col),
                  Math.max(sel.start.row, sel.end.row),
                  Math.max(sel.start.col, sel.end.col),
                );
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Delete row",
          testId: "menu-edit-delete-row",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) {
              const gs = useGridStore.getState();
              const sid = useSpreadsheetStore.getState().activeSheetId;
              useHistoryStore.getState().pushUndo();
              useCellStore.getState().deleteRows(sid, [sel.row], gs.totalRows);
              gs.deleteRowHeights([sel.row]);
              useGridStore
                .getState()
                .setTotalRows(Math.max(1, gs.totalRows - 1));
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Delete column",
          testId: "menu-edit-delete-col",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) {
              const gs = useGridStore.getState();
              const sid = useSpreadsheetStore.getState().activeSheetId;
              useHistoryStore.getState().pushUndo();
              useCellStore.getState().deleteCols(sid, [sel.col], gs.totalCols);
              gs.deleteColWidths([sel.col]);
              useGridStore
                .getState()
                .setTotalCols(Math.max(1, gs.totalCols - 1));
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Find and Replace",
          testId: "menu-edit-find",
          shortcut: "Ctrl+H",
          separator: true,
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
          label: showFormulas ? "✓ Show formulas" : "  Show formulas",
          testId: "menu-view-show-formulas",
          checked: showFormulas,
          shortcut: "Ctrl+`",
          action: () => {
            useGridStore.getState().toggleShowFormulas();
            setOpenMenu(null);
          },
        },
        {
          label: "Zoom",
          testId: "menu-view-zoom",
          action: () => setOpenMenu(null),
        },
        {
          label: "Full screen",
          testId: "menu-view-fullscreen",
          shortcut: "F11",
          separator: true,
          action: () => {
            const ui = useUIStore.getState();
            const newFullscreen = !ui.isFullscreen;
            ui.setFullscreen(newFullscreen);
            if (newFullscreen && document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
            setOpenMenu(null);
          },
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
        {
          label: "Comment",
          testId: "menu-insert-comment",
          shortcut: "Ctrl+Alt+M",
          separator: true,
          action: () => {
            useCommentStore.getState().openPanel();
            setOpenMenu(null);
          },
        },
        {
          label: "Checkbox",
          testId: "menu-insert-checkbox",
          separator: true,
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) {
              const sid = useSpreadsheetStore.getState().activeSheetId;
              useHistoryStore.getState().pushUndo();
              useCellStore.getState().setCell(sid, sel.row, sel.col, {
                value: false,
              });
              useValidationStore.getState().setRule(sid, sel.row, sel.col, {
                type: "checkbox",
              });
            }
            setOpenMenu(null);
          },
        },
        {
          label: "Dropdown",
          testId: "menu-insert-dropdown",
          action: () => {
            const sel = useUIStore.getState().selectedCell;
            if (sel) {
              const sid = useSpreadsheetStore.getState().activeSheetId;
              useValidationStore.getState().setRule(sid, sel.row, sel.col, {
                type: "dropdown-list",
                listValues: ["Option 1", "Option 2", "Option 3"],
              });
            }
            setOpenMenu(null);
          },
        },
        {
          label: "New sheet",
          testId: "menu-insert-new-sheet",
          separator: true,
          action: () => {
            useSpreadsheetStore.getState().addSheet();
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
        {
          label: "Alternating colors",
          testId: "menu-format-alternating-colors",
          separator: true,
          action: () => {
            useUIStore.getState().setBandedRowsDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Conditional formatting",
          testId: "menu-format-conditional",
          action: () => {
            useUIStore.getState().setConditionalFormatOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Theme",
          testId: "menu-format-theme",
          action: () => {
            useUIStore.getState().setThemeDialogOpen(true);
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
        {
          label: "Named functions",
          testId: "menu-data-named-functions",
          action: () => {
            useUIStore.getState().setNamedFunctionsDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Protected ranges",
          testId: "menu-data-protection",
          separator: true,
          action: () => {
            useUIStore.getState().setProtectionDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Remove duplicates",
          testId: "menu-data-remove-duplicates",
          action: () => {
            useUIStore.getState().setRemoveDuplicatesDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Text to columns",
          testId: "menu-data-text-to-columns",
          action: () => {
            useUIStore.getState().setTextToColumnsDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Insert slicer",
          testId: "menu-data-slicer",
          separator: true,
          action: () => {
            useUIStore.getState().setSlicerDialogOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Goal seek",
          testId: "menu-data-goal-seek",
          action: () => {
            useUIStore.getState().setGoalSeekDialogOpen(true);
            setOpenMenu(null);
          },
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
          label: "Notification rules",
          testId: "menu-tools-notifications",
          action: () => {
            useUIStore.getState().setNotificationRulesDialogOpen(true);
            setOpenMenu(null);
          },
        },
        ...(macroIsRecording
          ? [
              {
                label: "Stop Recording",
                testId: "menu-tools-stop-recording",
                separator: true,
                action: () => {
                  useMacroStore.getState().stopRecording();
                  setOpenMenu(null);
                },
              },
            ]
          : [
              {
                label: "Record Macro...",
                testId: "menu-tools-record-macro",
                separator: true,
                action: () => {
                  const name = prompt("Enter macro name:");
                  if (name?.trim()) {
                    useMacroStore.getState().startRecording(name.trim());
                  }
                  setOpenMenu(null);
                },
              },
            ]),
        {
          label: "Manage Macros...",
          testId: "menu-tools-manage-macros",
          action: () => {
            useUIStore.getState().setMacroManagerOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Explore data",
          testId: "menu-tools-explore",
          separator: true,
          action: () => {
            useUIStore.getState().setAIAnalysisOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Suggestions",
          testId: "menu-tools-suggestions",
          separator: true,
          action: () => {
            useSuggestionsStore.getState().toggleSidebar();
            setOpenMenu(null);
          },
        },
        {
          label: "Suggesting mode",
          testId: "menu-tools-suggesting-mode",
          checked: useSuggestionsStore.getState().editingMode === "suggesting",
          action: () => {
            const store = useSuggestionsStore.getState();
            store.setEditingMode(
              store.editingMode === "suggesting" ? "editing" : "suggesting",
            );
            setOpenMenu(null);
          },
        },
      ],
    },
    {
      label: "Help",
      testId: "menu-help",
      items: [
        {
          label: "Keyboard shortcuts",
          shortcut: "Ctrl+/",
          testId: "menu-help-keyboard-shortcuts",
          action: () => {
            useUIStore.getState().setKeyboardShortcutsOpen(true);
            setOpenMenu(null);
          },
        },
        {
          label: "Function list",
          testId: "menu-help-functions",
          action: () => setOpenMenu(null),
        },
      ],
    },
  ];

  return (
    <div
      ref={menuRef}
      data-testid="menu-bar"
      className="flex items-center bg-white px-2 h-7"
      style={{ padding: "0 8px", height: "28px" }}
    >
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            data-testid={menu.testId}
            className={`text-[13px] px-3 py-1 rounded transition-colors ${
              openMenu === menu.label
                ? "bg-gray-200 text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            style={{ padding: "4px 12px" }}
            onClick={() => handleMenuClick(menu.label)}
            onMouseEnter={() => {
              if (openMenu !== null) setOpenMenu(menu.label);
            }}
            type="button"
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div
              data-testid={`${menu.testId}-dropdown`}
              className="absolute left-0 top-full z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-56"
            >
              {menu.items.map((item, idx) => (
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
          )}
        </div>
      ))}
    </div>
  );
}
