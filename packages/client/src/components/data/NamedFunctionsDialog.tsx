import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useNamedFunctionStore } from "../../stores/namedFunctionStore";
import type { NamedFunction, NamedFunctionArg } from "../../types/grid";

interface EditingFunction {
  name: string;
  formula: string;
  description: string;
  args: NamedFunctionArg[];
  isNew: boolean;
  originalName: string;
}

function emptyEditing(): EditingFunction {
  return {
    name: "",
    formula: "",
    description: "",
    args: [],
    isNew: true,
    originalName: "",
  };
}

function toEditing(fn: NamedFunction): EditingFunction {
  return {
    name: fn.name,
    formula: fn.formula,
    description: fn.description,
    args: fn.args.map((a) => ({ ...a })),
    isNew: false,
    originalName: fn.name,
  };
}

export function NamedFunctionsDialog() {
  const isOpen = useUIStore((s) => s.isNamedFunctionsOpen);
  const close = useUIStore((s) => s.setNamedFunctionsOpen);
  const store = useNamedFunctionStore;

  const [editing, setEditing] = useState<EditingFunction | null>(null);
  const [error, setError] = useState("");

  const allFunctions = store((s) => s.getAllFunctions)();

  const handleClose = useCallback(() => {
    setEditing(null);
    setError("");
    close(false);
  }, [close]);

  const handleSave = useCallback(() => {
    if (!editing) return;
    setError("");

    const trimmedName = editing.name.trim();
    if (!trimmedName) {
      setError("Function name is required");
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedName)) {
      setError(
        "Name must start with a letter or underscore and contain only letters, digits, or underscores",
      );
      return;
    }
    if (!editing.formula.trim()) {
      setError("Formula is required");
      return;
    }

    const fnData: NamedFunction = {
      name: trimmedName,
      formula: editing.formula.trim(),
      description: editing.description.trim(),
      args: editing.args.filter((a) => a.name.trim()),
    };

    const state = store.getState();

    if (editing.isNew) {
      const added = state.addFunction(fnData);
      if (!added) {
        setError(`A function named "${trimmedName}" already exists`);
        return;
      }
    } else {
      if (editing.originalName !== trimmedName) {
        const renamed = state.renameFunction(editing.originalName, trimmedName);
        if (!renamed) {
          setError(`Cannot rename: "${trimmedName}" already exists`);
          return;
        }
      }
      state.updateFunction(trimmedName, {
        formula: fnData.formula,
        description: fnData.description,
        args: fnData.args,
      });
    }

    setEditing(null);
  }, [editing, store]);

  const handleDelete = useCallback(
    (name: string) => {
      store.getState().removeFunction(name);
      if (editing && editing.originalName === name) {
        setEditing(null);
      }
    },
    [editing, store],
  );

  const addArg = useCallback(() => {
    if (!editing) return;
    setEditing({
      ...editing,
      args: [...editing.args, { name: "", description: "" }],
    });
  }, [editing]);

  const removeArg = useCallback(
    (idx: number) => {
      if (!editing) return;
      setEditing({
        ...editing,
        args: editing.args.filter((_, i) => i !== idx),
      });
    },
    [editing],
  );

  const updateArg = useCallback(
    (idx: number, field: keyof NamedFunctionArg, value: string) => {
      if (!editing) return;
      const newArgs = editing.args.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a,
      );
      setEditing({ ...editing, args: newArgs });
    },
    [editing],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      data-testid="named-functions-overlay"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "560px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="named-functions-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Named Functions
        </h2>

        {!editing ? (
          <>
            {allFunctions.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginBottom: "16px",
                }}
                data-testid="named-functions-empty"
              >
                No named functions defined. Create one to reuse custom formulas
                across your spreadsheet.
              </p>
            ) : (
              <div style={{ marginBottom: "16px" }}>
                {allFunctions.map((fn) => (
                  <div
                    key={fn.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    data-testid={`named-fn-item-${fn.name}`}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        {fn.name}
                      </span>
                      {fn.args.length > 0 && (
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          ({fn.args.map((a) => a.name).join(", ")})
                        </span>
                      )}
                      {fn.description && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            margin: 0,
                          }}
                        >
                          {fn.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        data-testid={`named-fn-edit-${fn.name}`}
                        onClick={() => setEditing(toEditing(fn))}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          border: "1px solid #fca5a5",
                          borderRadius: "4px",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                        data-testid={`named-fn-delete-${fn.name}`}
                        onClick={() => handleDelete(fn.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
                data-testid="named-fn-add"
                onClick={() => setEditing(emptyEditing())}
              >
                Add function
              </button>
              <button
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                data-testid="named-fn-close"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Function name
              </label>
              <input
                type="text"
                placeholder="e.g. CELSIUS_TO_FAHRENHEIT"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  fontSize: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
                data-testid="named-fn-name-input"
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Description
              </label>
              <input
                type="text"
                placeholder="What does this function do?"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  fontSize: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
                data-testid="named-fn-description-input"
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <label style={{ fontSize: "13px", fontWeight: 500 }}>
                  Arguments
                </label>
                <button
                  style={{
                    padding: "2px 8px",
                    fontSize: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  data-testid="named-fn-add-arg"
                  onClick={addArg}
                >
                  + Add
                </button>
              </div>
              {editing.args.map((arg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "4px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Arg name"
                    value={arg.name}
                    onChange={(e) => updateArg(idx, "name", e.target.value)}
                    style={{
                      width: "120px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                    }}
                    data-testid={`named-fn-arg-name-${idx}`}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={arg.description}
                    onChange={(e) =>
                      updateArg(idx, "description", e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: "4px 8px",
                      fontSize: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                    }}
                    data-testid={`named-fn-arg-desc-${idx}`}
                  />
                  <button
                    style={{
                      padding: "2px 6px",
                      fontSize: "12px",
                      color: "#dc2626",
                      cursor: "pointer",
                      border: "none",
                      background: "none",
                    }}
                    data-testid={`named-fn-arg-remove-${idx}`}
                    onClick={() => removeArg(idx)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                Formula definition
              </label>
              <textarea
                placeholder="e.g. celsius * 9/5 + 32"
                value={editing.formula}
                onChange={(e) =>
                  setEditing({ ...editing, formula: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  fontSize: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  minHeight: "60px",
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
                data-testid="named-fn-formula-input"
              />
              <p
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  margin: "4px 0 0",
                }}
              >
                Use argument names as variables. Example: if args are
                &quot;celsius&quot;, formula is &quot;celsius * 9/5 + 32&quot;
              </p>
            </div>

            {error && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#ef4444",
                  marginBottom: "12px",
                }}
                data-testid="named-fn-error"
              >
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                data-testid="named-fn-cancel-edit"
                onClick={() => {
                  setEditing(null);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
                data-testid="named-fn-save"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
