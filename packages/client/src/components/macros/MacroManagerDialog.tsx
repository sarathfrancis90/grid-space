/**
 * MacroManagerDialog — modal for managing saved macros.
 * List, run, rename, delete, assign shortcuts, view scripts.
 */
import { useState, useCallback } from "react";
import { useMacroStore } from "../../stores/macroStore";
import { useUIStore } from "../../stores/uiStore";

const SHORTCUT_OPTIONS = [
  { label: "None", value: "" },
  { label: "Ctrl+Shift+1", value: "Ctrl+Shift+1" },
  { label: "Ctrl+Shift+2", value: "Ctrl+Shift+2" },
  { label: "Ctrl+Shift+3", value: "Ctrl+Shift+3" },
  { label: "Ctrl+Shift+4", value: "Ctrl+Shift+4" },
  { label: "Ctrl+Shift+5", value: "Ctrl+Shift+5" },
  { label: "Ctrl+Shift+6", value: "Ctrl+Shift+6" },
  { label: "Ctrl+Shift+7", value: "Ctrl+Shift+7" },
  { label: "Ctrl+Shift+8", value: "Ctrl+Shift+8" },
  { label: "Ctrl+Shift+9", value: "Ctrl+Shift+9" },
];

export function MacroManagerDialog() {
  const isOpen = useUIStore((s) => s.isMacroManagerOpen);
  const closeMacroManager = useUIStore((s) => s.setMacroManagerOpen);
  const macros = useMacroStore((s) => s.macros);
  const runMacro = useMacroStore((s) => s.runMacro);
  const deleteMacro = useMacroStore((s) => s.deleteMacro);
  const renameMacro = useMacroStore((s) => s.renameMacro);
  const setMacroShortcut = useMacroStore((s) => s.setMacroShortcut);
  const setSelectedMacro = useMacroStore((s) => s.setSelectedMacro);
  const openScriptEditor = useUIStore((s) => s.setScriptEditorOpen);
  const startRecording = useMacroStore((s) => s.startRecording);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [recordName, setRecordName] = useState("");
  const [showRecordPrompt, setShowRecordPrompt] = useState(false);

  const handleClose = useCallback(() => {
    closeMacroManager(false);
    setEditingId(null);
    setConfirmDeleteId(null);
    setShowRecordPrompt(false);
  }, [closeMacroManager]);

  const handleRun = useCallback(
    (id: string) => {
      runMacro(id);
      handleClose();
    },
    [runMacro, handleClose],
  );

  const handleStartEdit = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  }, []);

  const handleConfirmRename = useCallback(
    (id: string) => {
      if (editName.trim()) {
        renameMacro(id, editName.trim());
      }
      setEditingId(null);
    },
    [editName, renameMacro],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMacro(id);
      setConfirmDeleteId(null);
    },
    [deleteMacro],
  );

  const handleViewScript = useCallback(
    (id: string) => {
      setSelectedMacro(id);
      openScriptEditor(true);
      handleClose();
    },
    [setSelectedMacro, openScriptEditor, handleClose],
  );

  const handleRecordNew = useCallback(() => {
    if (recordName.trim()) {
      startRecording(recordName.trim());
      setShowRecordPrompt(false);
      setRecordName("");
      handleClose();
    }
  }, [recordName, startRecording, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="macro-manager-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        data-testid="macro-manager-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Manage Macros</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="macro-manager-close"
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

        {/* Body */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {macros.length === 0 ? (
            <div
              className="py-12 text-center text-gray-500"
              data-testid="macro-manager-empty"
            >
              <p className="text-base">No macros yet.</p>
              <p className="mt-1 text-sm text-gray-400">
                Click &quot;Record New&quot; to create your first macro.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm" data-testid="macro-manager-table">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Actions</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2">Shortcut</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {macros.map((macro) => (
                  <tr
                    key={macro.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                    data-testid={`macro-row-${macro.id}`}
                  >
                    <td className="py-2.5">
                      {editingId === macro.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleConfirmRename(macro.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleConfirmRename(macro.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="rounded border border-blue-300 px-2 py-0.5 text-sm outline-none"
                          data-testid={`macro-rename-input-${macro.id}`}
                        />
                      ) : (
                        <span className="font-medium text-gray-800">
                          {macro.name}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-600">
                      {macro.actions.length}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {new Date(macro.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <select
                        value={macro.shortcut}
                        onChange={(e) =>
                          setMacroShortcut(macro.id, e.target.value)
                        }
                        className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600"
                        data-testid={`macro-shortcut-${macro.id}`}
                      >
                        {SHORTCUT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRun(macro.id)}
                          className="rounded p-1 text-green-600 hover:bg-green-50"
                          title="Run"
                          data-testid={`macro-run-${macro.id}`}
                          type="button"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a.265.265 0 01.38-.03l7.232 5.478a.265.265 0 010 .416l-7.232 5.478a.265.265 0 01-.38-.03.263.263 0 01-.052-.159V3.614c0-.058.019-.115.052-.159z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleStartEdit(macro.id, macro.name)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100"
                          title="Rename"
                          data-testid={`macro-edit-${macro.id}`}
                          type="button"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleViewScript(macro.id)}
                          className="rounded p-1 text-blue-500 hover:bg-blue-50"
                          title="View Script"
                          data-testid={`macro-script-${macro.id}`}
                          type="button"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {confirmDeleteId === macro.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(macro.id)}
                              className="rounded px-2 py-0.5 text-xs bg-red-500 text-white hover:bg-red-600"
                              data-testid={`macro-confirm-delete-${macro.id}`}
                              type="button"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                              data-testid={`macro-cancel-delete-${macro.id}`}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(macro.id)}
                            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                            data-testid={`macro-delete-${macro.id}`}
                            type="button"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          {showRecordPrompt ? (
            <div className="flex items-center gap-2">
              <input
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRecordNew();
                  if (e.key === "Escape") setShowRecordPrompt(false);
                }}
                placeholder="Macro name..."
                autoFocus
                className="rounded border border-gray-300 px-3 py-1 text-sm outline-none focus:border-blue-400"
                data-testid="macro-record-name-input"
              />
              <button
                onClick={handleRecordNew}
                disabled={!recordName.trim()}
                className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                data-testid="macro-record-start"
                type="button"
              >
                Start Recording
              </button>
              <button
                onClick={() => setShowRecordPrompt(false)}
                className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
                data-testid="macro-record-cancel"
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRecordPrompt(true)}
              className="rounded bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
              data-testid="macro-record-new"
              type="button"
            >
              Record New
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            data-testid="macro-manager-done"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
