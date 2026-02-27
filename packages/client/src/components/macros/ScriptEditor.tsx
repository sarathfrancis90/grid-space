/**
 * ScriptEditor — displays macro script as readable pseudo-code.
 * Dark themed code viewer with copy and run functionality.
 */
import { useState, useCallback, useMemo } from "react";
import { useMacroStore } from "../../stores/macroStore";
import { useUIStore } from "../../stores/uiStore";

export function ScriptEditor() {
  const isOpen = useUIStore((s) => s.isScriptEditorOpen);
  const closeEditor = useUIStore((s) => s.setScriptEditorOpen);
  const selectedMacroId = useMacroStore((s) => s.selectedMacroId);
  const macros = useMacroStore((s) => s.macros);

  const [copied, setCopied] = useState(false);

  const selectedMacro = useMemo(
    () => macros.find((m) => m.id === selectedMacroId),
    [macros, selectedMacroId],
  );

  const script = useMemo(() => {
    if (!selectedMacroId) return "";
    return useMacroStore.getState().getMacroScript(selectedMacroId);
  }, [selectedMacroId, macros]);

  const handleClose = useCallback(() => {
    closeEditor(false);
  }, [closeEditor]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select textarea
    }
  }, [script]);

  const handleRun = useCallback(() => {
    if (selectedMacroId) {
      useMacroStore.getState().runMacro(selectedMacroId);
      handleClose();
    }
  }, [selectedMacroId, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="script-editor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
        data-testid="script-editor-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Script Editor
            </h2>
            {selectedMacro && (
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedMacro.name}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="script-editor-close"
            type="button"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Code area */}
        <div className="px-6 py-4">
          {!selectedMacro ? (
            <div
              className="py-8 text-center text-gray-500"
              data-testid="script-editor-empty"
            >
              No macro selected.
            </div>
          ) : (
            <div
              className="rounded-lg overflow-hidden"
              data-testid="script-editor-code-area"
            >
              <textarea
                readOnly
                value={script}
                className="w-full h-64 resize-none border-0 bg-gray-900 p-4 font-mono text-sm text-green-300 outline-none"
                style={{
                  height: "256px",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  fontSize: "13px",
                  lineHeight: "1.5",
                  tabSize: 2,
                }}
                data-testid="script-editor-textarea"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!selectedMacro}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              data-testid="script-editor-copy"
              type="button"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleRun}
              disabled={!selectedMacro}
              className="rounded bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
              data-testid="script-editor-run"
              type="button"
            >
              Run
            </button>
          </div>
          <button
            onClick={handleClose}
            className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            data-testid="script-editor-done"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
