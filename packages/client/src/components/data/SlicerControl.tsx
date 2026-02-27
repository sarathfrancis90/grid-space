/**
 * SlicerControl — floating panel for slicer visual filtering.
 * Renders one panel per slicer on the current sheet, allowing users
 * to check/uncheck values to filter rows.
 */
import { useState, useMemo } from "react";
import { useDataStore } from "../../stores/dataStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useUIStore } from "../../stores/uiStore";
import { colToLetter } from "../../utils/coordinates";

/** Dialog for inserting a new slicer (shown when Insert Slicer menu is clicked) */
function SlicerInsertDialog() {
  const isOpen = useUIStore((s) => s.isSlicerDialogOpen);
  const close = useUIStore((s) => s.setSlicerDialogOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const selections = useUIStore((s) => s.selections);
  const [selectedCol, setSelectedCol] = useState(0);

  const colRange = useMemo(() => {
    if (selections.length === 0) return { start: 0, end: 5 };
    const sel = selections[selections.length - 1];
    return {
      start: Math.min(sel.start.col, sel.end.col),
      end: Math.max(sel.start.col, sel.end.col),
    };
  }, [selections]);

  if (!isOpen) return null;

  const handleInsert = () => {
    if (!sheetId) return;
    const col = colRange.start + selectedCol;
    useDataStore.getState().addSlicer({
      id: `slicer-${Date.now()}`,
      sheetId,
      targetCol: col,
      title: `Column ${colToLetter(col)}`,
      x: 100,
      y: 100,
      width: 200,
      height: 300,
      selectedValues: new Set<string>(),
    });
    close(false);
  };

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
      data-testid="slicer-insert-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-72"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "288px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="slicer-insert-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Insert Slicer
        </h2>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
          Select a column to filter:
        </p>
        <div
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            marginBottom: "16px",
          }}
        >
          {Array.from({ length: colRange.end - colRange.start + 1 }, (_, i) => (
            <label
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="slicer-col"
                checked={selectedCol === i}
                onChange={() => setSelectedCol(i)}
                data-testid={`slicer-col-${i}`}
              />
              <span style={{ fontSize: "13px" }}>
                Column {colToLetter(colRange.start + i)}
              </span>
            </label>
          ))}
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            data-testid="slicer-insert-cancel"
            onClick={() => close(false)}
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
            }}
            data-testid="slicer-insert-confirm"
            onClick={handleInsert}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

/** Individual slicer panel */
function SlicerPanel({ slicerId }: { slicerId: string }) {
  const slicer = useDataStore((s) => s.getSlicer(slicerId));
  const removeSlicer = useDataStore((s) => s.removeSlicer);
  const updateSelection = useDataStore((s) => s.updateSlicerSelection);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const [search, setSearch] = useState("");

  // Get unique values in the target column
  const uniqueValues = useMemo(() => {
    if (!slicer || !sheetId) return [];
    const cellStore = useCellStore.getState();
    const lastPos = cellStore.getLastDataPosition(sheetId);
    const vals = new Set<string>();
    for (let r = 0; r <= lastPos.row; r++) {
      const cell = cellStore.getCell(sheetId, r, slicer.targetCol);
      const v = String(cell?.value ?? "");
      if (v.trim()) vals.add(v);
    }
    return Array.from(vals).sort();
  }, [slicer, sheetId]);

  const filteredValues = useMemo(() => {
    if (!search) return uniqueValues;
    const lower = search.toLowerCase();
    return uniqueValues.filter((v) => v.toLowerCase().includes(lower));
  }, [uniqueValues, search]);

  if (!slicer) return null;

  const isSelected = (val: string) =>
    slicer.selectedValues.size === 0 || slicer.selectedValues.has(val);

  const toggleValue = (val: string) => {
    const next = new Set(slicer.selectedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    updateSelection(slicerId, next);
  };

  const selectAll = () => {
    updateSelection(slicerId, new Set<string>());
  };

  const clearAll = () => {
    updateSelection(slicerId, new Set<string>(["__none__"]));
  };

  return (
    <div
      style={{
        position: "absolute",
        left: slicer.x,
        top: slicer.y,
        width: slicer.width,
        height: slicer.height,
        backgroundColor: "white",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      data-testid={`slicer-${slicerId}`}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#f3f4f6",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "13px" }}>
          {slicer.title}
        </span>
        <button
          style={{ fontSize: "12px", color: "#ef4444", cursor: "pointer" }}
          onClick={() => removeSlicer(slicerId)}
          data-testid={`slicer-remove-${slicerId}`}
        >
          x
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #f3f4f6" }}>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
          data-testid={`slicer-search-${slicerId}`}
        />
      </div>

      {/* Select all / clear all */}
      <div
        style={{
          padding: "4px 8px",
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <button
          style={{ fontSize: "11px", color: "#2563eb", cursor: "pointer" }}
          onClick={selectAll}
          data-testid={`slicer-select-all-${slicerId}`}
        >
          Select All
        </button>
        <button
          style={{ fontSize: "11px", color: "#2563eb", cursor: "pointer" }}
          onClick={clearAll}
          data-testid={`slicer-clear-all-${slicerId}`}
        >
          Clear All
        </button>
      </div>

      {/* Values list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 0",
        }}
      >
        {filteredValues.map((val) => (
          <label
            key={val}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "3px 12px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={isSelected(val)}
              onChange={() => toggleValue(val)}
              data-testid={`slicer-value-${val}`}
            />
            <span>{val}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Render all slicers for the active sheet + insert dialog */
export function SlicerControl() {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const slicers = useDataStore((s) =>
    sheetId ? s.getSlicersForSheet(sheetId) : [],
  );

  return (
    <>
      <SlicerInsertDialog />
      {slicers.map((s) => (
        <SlicerPanel key={s.id} slicerId={s.id} />
      ))}
    </>
  );
}
