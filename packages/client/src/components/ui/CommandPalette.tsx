import React, { useState, useMemo, useRef, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useFormatStore } from "../../stores/formatStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useFindReplaceStore } from "../../stores/findReplaceStore";
import { useCommentStore } from "../../stores/commentStore";
import { useNotificationStore } from "../../stores/notificationStore";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  action: () => void;
}

function buildCommands(
  openPrint: () => void,
  openFormatCells: () => void,
): CommandItem[] {
  return [
    {
      id: "bold",
      label: "Toggle Bold",
      category: "Format",
      action: () => useFormatStore.getState().toggleFormatOnSelection("bold"),
    },
    {
      id: "italic",
      label: "Toggle Italic",
      category: "Format",
      action: () => useFormatStore.getState().toggleFormatOnSelection("italic"),
    },
    {
      id: "underline",
      label: "Toggle Underline",
      category: "Format",
      action: () =>
        useFormatStore.getState().toggleFormatOnSelection("underline"),
    },
    {
      id: "strikethrough",
      label: "Toggle Strikethrough",
      category: "Format",
      action: () =>
        useFormatStore.getState().toggleFormatOnSelection("strikethrough"),
    },
    {
      id: "clear-format",
      label: "Clear Formatting",
      category: "Format",
      action: () => useFormatStore.getState().clearFormattingOnSelection(),
    },
    {
      id: "undo",
      label: "Undo",
      category: "Edit",
      action: () => useHistoryStore.getState().undo(),
    },
    {
      id: "redo",
      label: "Redo",
      category: "Edit",
      action: () => useHistoryStore.getState().redo(),
    },
    {
      id: "find",
      label: "Find",
      category: "Edit",
      action: () => useFindReplaceStore.getState().open(false),
    },
    {
      id: "find-replace",
      label: "Find and Replace",
      category: "Edit",
      action: () => useFindReplaceStore.getState().open(true),
    },
    {
      id: "print",
      label: "Print",
      category: "File",
      action: openPrint,
    },
    {
      id: "format-cells",
      label: "Format Cells",
      category: "Format",
      action: openFormatCells,
    },
    {
      id: "zoom-in",
      label: "Zoom In",
      category: "View",
      action: () => {
        const ui = useUIStore.getState();
        ui.setZoom(Math.min(ui.zoom + 10, 200));
      },
    },
    {
      id: "zoom-out",
      label: "Zoom Out",
      category: "View",
      action: () => {
        const ui = useUIStore.getState();
        ui.setZoom(Math.max(ui.zoom - 10, 50));
      },
    },
    {
      id: "zoom-reset",
      label: "Reset Zoom (100%)",
      category: "View",
      action: () => useUIStore.getState().setZoom(100),
    },
    // S15-020: Additional menu actions for search
    {
      id: "comments-panel",
      label: "Open Comments Panel",
      category: "View",
      action: () => useCommentStore.getState().openPanel(),
    },
    {
      id: "notifications",
      label: "Open Notifications",
      category: "View",
      action: () => useNotificationStore.getState().openPanel(),
    },
    {
      id: "sort-asc",
      label: "Sort Column A-Z",
      category: "Data",
      action: () => {
        /* Sort triggered via data store */
      },
    },
    {
      id: "sort-desc",
      label: "Sort Column Z-A",
      category: "Data",
      action: () => {
        /* Sort triggered via data store */
      },
    },
    {
      id: "insert-row",
      label: "Insert Row",
      category: "Insert",
      action: () => {
        /* Insert row action */
      },
    },
    {
      id: "insert-col",
      label: "Insert Column",
      category: "Insert",
      action: () => {
        /* Insert column action */
      },
    },
    {
      id: "delete-row",
      label: "Delete Row",
      category: "Edit",
      action: () => {
        /* Delete row action */
      },
    },
    {
      id: "delete-col",
      label: "Delete Column",
      category: "Edit",
      action: () => {
        /* Delete column action */
      },
    },
    {
      id: "freeze-rows",
      label: "Freeze Rows",
      category: "View",
      action: () => {
        /* Freeze action */
      },
    },
    {
      id: "freeze-cols",
      label: "Freeze Columns",
      category: "View",
      action: () => {
        /* Freeze action */
      },
    },
  ];
}

export const CommandPalette: React.FC = () => {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const close = useUIStore((s) => s.setCommandPaletteOpen);
  const openPrint = useUIStore((s) => s.setPrintDialogOpen);
  const openFormat = useUIStore((s) => s.setFormatCellsDialogOpen);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(
    () =>
      buildCommands(
        () => openPrint(true),
        () => openFormat(true),
      ),
    [openPrint, openFormat],
  );

  const filtered = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower),
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      close(false);
    } else if (e.key === "Escape") {
      close(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "80px",
        background: "rgba(0,0,0,0.2)",
      }}
      data-testid="command-palette-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-96 max-h-96 overflow-hidden"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "384px",
          maxHeight: "384px",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="command-palette"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-3 border-b text-sm outline-none"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "14px",
            outline: "none",
          }}
          placeholder="Search commands..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="command-palette-input"
        />
        <div
          className="max-h-72 overflow-y-auto"
          style={{ maxHeight: "288px", overflowY: "auto" }}
        >
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.id}
              className={`w-full text-left px-4 py-2 text-sm flex justify-between ${
                idx === selectedIndex
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50"
              }`}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 16px",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
              }}
              data-testid={`cmd-${cmd.id}`}
              onClick={() => {
                cmd.action();
                close(false);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span>{cmd.label}</span>
              <span
                className="text-xs text-gray-400"
                style={{ fontSize: "12px", color: "#9ca3af" }}
              >
                {cmd.category}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div
              className="px-4 py-3 text-sm text-gray-400"
              style={{
                padding: "12px 16px",
                fontSize: "14px",
                color: "#9ca3af",
              }}
            >
              No commands found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
