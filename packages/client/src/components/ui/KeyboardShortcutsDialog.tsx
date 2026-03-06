/**
 * KeyboardShortcutsDialog — modal showing all available keyboard shortcuts.
 * Triggered by Ctrl+/ (Google Sheets parity).
 */
import { useCallback, useEffect } from "react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: "Ctrl + Z", description: "Undo" },
      { keys: "Ctrl + Y", description: "Redo" },
      { keys: "Ctrl + Shift + Z", description: "Redo (alternate)" },
      { keys: "Ctrl + F", description: "Find" },
      { keys: "Ctrl + H", description: "Find and replace" },
      { keys: "Ctrl + P", description: "Print" },
      { keys: "Ctrl + /", description: "Keyboard shortcuts" },
      { keys: "Ctrl + Shift + P", description: "Command palette" },
      { keys: "Escape", description: "Close dialog / Cancel edit" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Arrow keys", description: "Move one cell" },
      { keys: "Tab", description: "Move right" },
      { keys: "Shift + Tab", description: "Move left" },
      { keys: "Enter", description: "Move down / Confirm edit" },
      { keys: "Shift + Enter", description: "Move up" },
      { keys: "Ctrl + Home", description: "Go to cell A1" },
      { keys: "Ctrl + End", description: "Go to last cell with data" },
      { keys: "F2", description: "Edit active cell" },
    ],
  },
  {
    title: "Selection",
    shortcuts: [
      { keys: "Shift + Click", description: "Extend selection" },
      { keys: "Ctrl + Click", description: "Add to selection" },
      { keys: "Ctrl + A", description: "Select all" },
      { keys: "Shift + Arrow", description: "Extend selection by one cell" },
      { keys: "Ctrl + Shift + End", description: "Extend to last cell" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: "Ctrl + C", description: "Copy" },
      { keys: "Ctrl + X", description: "Cut" },
      { keys: "Ctrl + V", description: "Paste" },
      { keys: "Ctrl + Shift + V", description: "Paste special" },
      { keys: "Delete", description: "Clear cell contents" },
      { keys: "Ctrl + E", description: "Flash fill" },
      { keys: "Ctrl + ;", description: "Insert current date" },
      { keys: "Alt + Enter", description: "New line in cell" },
    ],
  },
  {
    title: "Formatting",
    shortcuts: [
      { keys: "Ctrl + B", description: "Bold" },
      { keys: "Ctrl + I", description: "Italic" },
      { keys: "Ctrl + U", description: "Underline" },
      { keys: "Ctrl + 5", description: "Strikethrough" },
      { keys: "Ctrl + \\", description: "Clear formatting" },
      { keys: "Ctrl + 1", description: "Format cells dialog" },
    ],
  },
  {
    title: "Number Formats",
    shortcuts: [
      { keys: "Ctrl + Shift + 1", description: "Number format" },
      { keys: "Ctrl + Shift + 2", description: "Time format" },
      { keys: "Ctrl + Shift + 3", description: "Date format" },
      { keys: "Ctrl + Shift + 4", description: "Currency format" },
      { keys: "Ctrl + Shift + 5", description: "Percent format" },
      { keys: "Ctrl + Shift + 6", description: "Scientific format" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: "Ctrl + =", description: "Zoom in" },
      { keys: "Ctrl + -", description: "Zoom out" },
      { keys: "Ctrl + Alt + Shift + H", description: "Version history" },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      data-testid="keyboard-shortcuts-overlay"
    >
      <div
        className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="keyboard-shortcuts-dialog"
        style={{
          maxHeight: "80vh",
          maxWidth: "640px",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4"
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            className="text-lg font-semibold text-gray-900"
            style={{ fontSize: "18px", fontWeight: 600 }}
          >
            Keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="keyboard-shortcuts-close"
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="px-6 py-4" style={{ padding: "16px 24px" }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div
              key={group.title}
              className="mb-6"
              style={{ marginBottom: "24px" }}
            >
              <h3
                className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    <span
                      className="text-sm text-gray-700"
                      style={{ fontSize: "13px", color: "#374151" }}
                    >
                      {shortcut.description}
                    </span>
                    <kbd
                      className="ml-4 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-xs text-gray-600"
                      style={{
                        fontSize: "12px",
                        fontFamily: "monospace",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        color: "#4b5563",
                      }}
                    >
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
