import { useState, useCallback, useMemo } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useNamedFunctionStore } from "../../stores/namedFunctionStore";
import { isValidFunctionName } from "../../stores/namedFunctionStore";
import type { NamedFunction, NamedFunctionArgument } from "../../types/grid";

type ViewMode = "list" | "create" | "edit";

interface ArgumentEditorProps {
  args: NamedFunctionArgument[];
  onChange: (args: NamedFunctionArgument[]) => void;
}

function ArgumentEditor({ args, onChange }: ArgumentEditorProps) {
  const addArg = () => {
    onChange([...args, { name: "", description: "" }]);
  };

  const removeArg = (index: number) => {
    onChange(args.filter((_, i) => i !== index));
  };

  const updateArg = (
    index: number,
    field: "name" | "description",
    value: string,
  ) => {
    const updated = args.map((arg, i) =>
      i === index ? { ...arg, [field]: value } : arg,
    );
    onChange(updated);
  };

  return (
    <div data-testid="named-fn-args-editor">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Arguments</label>
        <button
          type="button"
          data-testid="named-fn-add-arg"
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={addArg}
        >
          + Add argument
        </button>
      </div>
      {args.length === 0 && (
        <p className="text-xs text-gray-400 italic">No arguments defined</p>
      )}
      {args.map((arg, i) => (
        <div key={i} className="flex gap-2 mb-2 items-start">
          <input
            data-testid={`named-fn-arg-name-${i}`}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            placeholder="Argument name"
            value={arg.name}
            onChange={(e) => updateArg(i, "name", e.target.value)}
          />
          <input
            data-testid={`named-fn-arg-desc-${i}`}
            className="flex-2 text-sm border border-gray-300 rounded px-2 py-1"
            placeholder="Description"
            value={arg.description}
            onChange={(e) => updateArg(i, "description", e.target.value)}
          />
          <button
            type="button"
            data-testid={`named-fn-remove-arg-${i}`}
            className="text-red-400 hover:text-red-600 text-sm px-1"
            onClick={() => removeArg(i)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export function NamedFunctionsDialog() {
  const isOpen = useUIStore((s) => s.isNamedFunctionsDialogOpen);
  const functions = useNamedFunctionStore((s) => s.functions);
  const allFunctions = useMemo(
    () => Array.from(functions.values()),
    [functions],
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingName, setEditingName] = useState<string | null>(null);

  // Form state
  const [fnName, setFnName] = useState("");
  const [fnDescription, setFnDescription] = useState("");
  const [fnBody, setFnBody] = useState("");
  const [fnArgs, setFnArgs] = useState<NamedFunctionArgument[]>([]);
  const [error, setError] = useState("");

  const close = useCallback(() => {
    useUIStore.getState().setNamedFunctionsDialogOpen(false);
    setViewMode("list");
    setEditingName(null);
    setError("");
  }, []);

  const resetForm = useCallback(() => {
    setFnName("");
    setFnDescription("");
    setFnBody("");
    setFnArgs([]);
    setError("");
  }, []);

  const startCreate = useCallback(() => {
    resetForm();
    setViewMode("create");
  }, [resetForm]);

  const startEdit = useCallback((fn: NamedFunction) => {
    setFnName(fn.name);
    setFnDescription(fn.description);
    setFnBody(fn.formulaBody);
    setFnArgs([...fn.arguments]);
    setEditingName(fn.name);
    setError("");
    setViewMode("edit");
  }, []);

  const handleSave = useCallback(() => {
    if (!fnName.trim()) {
      setError("Function name is required");
      return;
    }
    if (!isValidFunctionName(fnName.trim())) {
      setError(
        "Invalid function name. Use letters, numbers, underscores, and dots. Cannot be a built-in function name.",
      );
      return;
    }
    if (!fnBody.trim()) {
      setError("Formula body is required");
      return;
    }
    for (const arg of fnArgs) {
      if (!arg.name.trim()) {
        setError("All argument names must be filled in");
        return;
      }
    }

    const store = useNamedFunctionStore.getState();

    if (viewMode === "create") {
      const success = store.addFunction({
        name: fnName.trim(),
        formulaBody: fnBody.trim(),
        description: fnDescription.trim(),
        arguments: fnArgs.map((a) => ({
          name: a.name.trim(),
          description: a.description.trim(),
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      if (!success) {
        setError(
          "A function with this name already exists or the name is reserved",
        );
        return;
      }
    } else if (viewMode === "edit" && editingName) {
      if (editingName !== fnName.trim()) {
        const renamed = store.renameFunction(editingName, fnName.trim());
        if (!renamed) {
          setError("Cannot rename: name is taken or invalid");
          return;
        }
      }
      store.updateFunction(fnName.trim(), {
        formulaBody: fnBody.trim(),
        description: fnDescription.trim(),
        arguments: fnArgs.map((a) => ({
          name: a.name.trim(),
          description: a.description.trim(),
        })),
      });
    }

    setViewMode("list");
    setEditingName(null);
    resetForm();
  }, [viewMode, editingName, fnName, fnDescription, fnBody, fnArgs, resetForm]);

  const handleDelete = useCallback((name: string) => {
    useNamedFunctionStore.getState().removeFunction(name);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      data-testid="named-functions-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/30" onClick={close} />
      <div className="relative bg-white rounded-lg shadow-xl w-[560px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === "list" && "Named Functions"}
            {viewMode === "create" && "Create Named Function"}
            {viewMode === "edit" && "Edit Named Function"}
          </h2>
          <button
            data-testid="named-fn-close"
            className="text-gray-400 hover:text-gray-600"
            onClick={close}
            type="button"
          >
            x
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {viewMode === "list" && (
            <div data-testid="named-fn-list">
              {allFunctions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No named functions defined yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {allFunctions.map((fn) => (
                    <div
                      key={fn.name}
                      data-testid={`named-fn-item-${fn.name}`}
                      className="border rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-medium text-sm text-blue-700">
                            {fn.name}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">
                            ({fn.arguments.map((a) => a.name).join(", ")})
                          </span>
                          {fn.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {fn.description}
                            </p>
                          )}
                          <p className="text-xs font-mono text-gray-400 mt-1">
                            = {fn.formulaBody}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            data-testid={`named-fn-edit-${fn.name}`}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                            onClick={() => startEdit(fn)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            data-testid={`named-fn-delete-${fn.name}`}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                            onClick={() => handleDelete(fn.name)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(viewMode === "create" || viewMode === "edit") && (
            <div className="space-y-4" data-testid="named-fn-form">
              {error && (
                <div
                  data-testid="named-fn-error"
                  className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
                >
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Function name
                </label>
                <input
                  data-testid="named-fn-name-input"
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-mono"
                  placeholder="MY_FUNCTION"
                  value={fnName}
                  onChange={(e) => setFnName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  data-testid="named-fn-desc-input"
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                  placeholder="What does this function do?"
                  value={fnDescription}
                  onChange={(e) => setFnDescription(e.target.value)}
                />
              </div>
              <ArgumentEditor args={fnArgs} onChange={setFnArgs} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formula definition
                </label>
                <textarea
                  data-testid="named-fn-body-input"
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 font-mono min-h-[80px]"
                  placeholder="e.g., x * 2 + y"
                  value={fnBody}
                  onChange={(e) => setFnBody(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use argument names in the formula. Example: if arguments are
                  &quot;x&quot; and &quot;y&quot;, write &quot;x + y&quot;
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50 rounded-b-lg">
          {viewMode === "list" ? (
            <>
              <button
                data-testid="named-fn-create-btn"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={startCreate}
                type="button"
              >
                Create function
              </button>
              <button
                data-testid="named-fn-done-btn"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                onClick={close}
                type="button"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                data-testid="named-fn-cancel-btn"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                onClick={() => {
                  setViewMode("list");
                  setEditingName(null);
                  resetForm();
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                data-testid="named-fn-save-btn"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleSave}
                type="button"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
