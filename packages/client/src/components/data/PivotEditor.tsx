import { useCallback } from "react";
import { usePivotStore } from "../../stores/pivotStore";
import type { PivotAggregation } from "../../types/grid";

export function PivotEditor() {
  const editorOpen = usePivotStore((s) => s.editorOpen);
  const editingPivotId = usePivotStore((s) => s.editingPivotId);
  const closeEditor = usePivotStore((s) => s.closeEditor);
  const setRowFields = usePivotStore((s) => s.setRowFields);
  const setColFields = usePivotStore((s) => s.setColFields);
  const setValueFields = usePivotStore((s) => s.setValueFields);

  const pivot = usePivotStore((s) =>
    s.editingPivotId ? s.pivots.get(s.editingPivotId) : undefined,
  );

  const handleAddRowField = useCallback(
    (col: number, label: string) => {
      if (!editingPivotId || !pivot) return;
      setRowFields(editingPivotId, [...pivot.rowFields, { col, label }]);
    },
    [editingPivotId, pivot, setRowFields],
  );

  const handleAddColField = useCallback(
    (col: number, label: string) => {
      if (!editingPivotId || !pivot) return;
      setColFields(editingPivotId, [...pivot.colFields, { col, label }]);
    },
    [editingPivotId, pivot, setColFields],
  );

  const handleAddValueField = useCallback(
    (col: number, label: string, aggregation: PivotAggregation) => {
      if (!editingPivotId || !pivot) return;
      setValueFields(editingPivotId, [
        ...pivot.valueFields,
        { col, label, aggregation },
      ]);
    },
    [editingPivotId, pivot, setValueFields],
  );

  const handleRemoveRowField = useCallback(
    (idx: number) => {
      if (!editingPivotId || !pivot) return;
      const fields = [...pivot.rowFields];
      fields.splice(idx, 1);
      setRowFields(editingPivotId, fields);
    },
    [editingPivotId, pivot, setRowFields],
  );

  const handleRemoveColField = useCallback(
    (idx: number) => {
      if (!editingPivotId || !pivot) return;
      const fields = [...pivot.colFields];
      fields.splice(idx, 1);
      setColFields(editingPivotId, fields);
    },
    [editingPivotId, pivot, setColFields],
  );

  const handleRemoveValueField = useCallback(
    (idx: number) => {
      if (!editingPivotId || !pivot) return;
      const fields = [...pivot.valueFields];
      fields.splice(idx, 1);
      setValueFields(editingPivotId, fields);
    },
    [editingPivotId, pivot, setValueFields],
  );

  if (!editorOpen || !pivot) return null;

  // Compute available columns from source range
  const startCol = Math.min(
    pivot.sourceRange.start.col,
    pivot.sourceRange.end.col,
  );
  const endCol = Math.max(
    pivot.sourceRange.start.col,
    pivot.sourceRange.end.col,
  );
  const availableCols = [];
  for (let c = startCol; c <= endCol; c++) {
    availableCols.push({ col: c, label: `Column ${c + 1}` });
  }

  return (
    <div
      data-testid="pivot-editor"
      className="fixed right-0 top-0 w-[300px] h-screen bg-white border-l border-gray-300 shadow-lg z-[200] flex flex-col overflow-auto"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: 300,
        height: "100vh",
        background: "white",
        borderLeft: "1px solid #dadce0",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <div
        className="flex items-center justify-between p-3 border-b border-gray-300"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #dadce0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}
        >
          Pivot Table Editor
        </h3>
        <button
          data-testid="pivot-editor-close"
          onClick={closeEditor}
          className="text-lg hover:bg-gray-100 rounded"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "18px",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          &#10005;
        </button>
      </div>

      <div className="p-4 flex-1" style={{ padding: "16px", flex: 1 }}>
        {/* Available columns */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <div
            className="text-xs font-semibold mb-2 text-gray-600"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#444",
            }}
          >
            Available Fields
          </div>
          {availableCols.map(({ col, label }) => (
            <div
              key={col}
              data-testid={`pivot-field-${col}`}
              className="flex items-center gap-1 border border-gray-200 rounded mb-1 px-2 py-1 text-xs"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                border: "1px solid #e2e2e2",
                borderRadius: "4px",
                marginBottom: "4px",
                display: "flex",
                gap: "4px",
              }}
            >
              <span className="flex-1" style={{ flex: 1 }}>
                {label}
              </span>
              <button
                data-testid={`pivot-add-row-${col}`}
                onClick={() => handleAddRowField(col, label)}
                className="text-blue-600 hover:text-blue-800"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                  color: "#1a73e8",
                }}
              >
                +Row
              </button>
              <button
                data-testid={`pivot-add-col-${col}`}
                onClick={() => handleAddColField(col, label)}
                className="text-blue-600 hover:text-blue-800"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                  color: "#1a73e8",
                }}
              >
                +Col
              </button>
              <button
                data-testid={`pivot-add-value-${col}`}
                onClick={() => handleAddValueField(col, label, "SUM")}
                className="text-blue-600 hover:text-blue-800"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                  color: "#1a73e8",
                }}
              >
                +Val
              </button>
            </div>
          ))}
        </div>

        {/* Row fields */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <div
            className="text-xs font-semibold mb-1 text-gray-600"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#444",
            }}
          >
            Rows
          </div>
          {pivot.rowFields.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-blue-50 rounded mb-0.5 px-2 py-1 text-xs"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                background: "#e8f0fe",
                borderRadius: "4px",
                marginBottom: "2px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {f.label}
              <button
                onClick={() => handleRemoveRowField(i)}
                className="hover:text-red-500"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                }}
              >
                &#10005;
              </button>
            </div>
          ))}
          {pivot.rowFields.length === 0 && (
            <div
              className="text-xs text-gray-400 px-2 py-1"
              style={{ fontSize: "11px", color: "#999", padding: "4px 8px" }}
            >
              Drag fields here
            </div>
          )}
        </div>

        {/* Column fields */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <div
            className="text-xs font-semibold mb-1 text-gray-600"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#444",
            }}
          >
            Columns
          </div>
          {pivot.colFields.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-red-50 rounded mb-0.5 px-2 py-1 text-xs"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                background: "#fce8e6",
                borderRadius: "4px",
                marginBottom: "2px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {f.label}
              <button
                onClick={() => handleRemoveColField(i)}
                className="hover:text-red-500"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                }}
              >
                &#10005;
              </button>
            </div>
          ))}
          {pivot.colFields.length === 0 && (
            <div
              className="text-xs text-gray-400 px-2 py-1"
              style={{ fontSize: "11px", color: "#999", padding: "4px 8px" }}
            >
              Drag fields here
            </div>
          )}
        </div>

        {/* Value fields */}
        <div className="mb-4" style={{ marginBottom: "16px" }}>
          <div
            className="text-xs font-semibold mb-1 text-gray-600"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#444",
            }}
          >
            Values
          </div>
          {pivot.valueFields.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-green-50 rounded mb-0.5 px-2 py-1 text-xs"
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                background: "#e6f4ea",
                borderRadius: "4px",
                marginBottom: "2px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {f.label} ({f.aggregation})
              </span>
              <button
                onClick={() => handleRemoveValueField(i)}
                className="hover:text-red-500"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "10px",
                }}
              >
                &#10005;
              </button>
            </div>
          ))}
          {pivot.valueFields.length === 0 && (
            <div
              className="text-xs text-gray-400 px-2 py-1"
              style={{ fontSize: "11px", color: "#999", padding: "4px 8px" }}
            >
              Drag fields here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
