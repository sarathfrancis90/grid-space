/**
 * GoalSeekDialog — iteratively find an input value that makes a formula
 * cell reach a target value.
 */
import { useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { useFormulaStore } from "../../stores/formulaStore";
import { useHistoryStore } from "../../stores/historyStore";
import { cellRefToPosition, getCellKey } from "../../utils/coordinates";
import type { CellValueGetter } from "../../types/formula";

interface GoalSeekResult {
  found: boolean;
  value: number;
  iterations: number;
  finalResult: number;
}

function runGoalSeek(
  sheetId: string,
  formulaCellKey: string,
  targetValue: number,
  changingRow: number,
  changingCol: number,
): GoalSeekResult {
  const cellStore = useCellStore.getState();
  const formulaStore = useFormulaStore.getState();
  const formulaCell = cellStore.getCell(
    sheetId,
    ...(formulaCellKey.split(",").map(Number) as [number, number]),
  );

  if (!formulaCell?.formula) {
    return { found: false, value: 0, iterations: 0, finalResult: 0 };
  }

  const formula = formulaCell.formula;

  // Create a getter that reads from the cell store but overrides the changing cell
  const evaluate = (inputValue: number): number => {
    // Temporarily set the changing cell value
    const original = cellStore.getCell(sheetId, changingRow, changingCol);
    cellStore.setCell(sheetId, changingRow, changingCol, {
      value: inputValue,
      format: original?.format,
      comment: original?.comment,
    });

    const getCellValue: CellValueGetter = (
      _sheet: string | undefined,
      col: number,
      row: number,
    ) => {
      const cell = useCellStore.getState().getCell(sheetId, row, col);
      if (!cell) return null;
      if (cell.formula) {
        const key = getCellKey(row, col);
        const result = formulaStore.evaluateFormula(
          cell.formula,
          getCellValue,
          key,
        );
        return typeof result === "object" ? null : result;
      }
      return cell.value;
    };

    const result = formulaStore.evaluateFormula(
      formula,
      getCellValue,
      formulaCellKey,
    );

    return typeof result === "number" ? result : Number(result);
  };

  const MAX_ITERATIONS = 1000;
  const TOLERANCE = 0.00001;

  // Binary search / Newton's method hybrid
  let low = -1e8;
  let high = 1e8;
  let mid = 0;
  let iterations = 0;

  // First try to bracket the solution
  const fLow = evaluate(low);
  const fHigh = evaluate(high);

  if (isNaN(fLow) || isNaN(fHigh)) {
    // Narrower range if extreme values cause errors
    low = -1000;
    high = 1000;
  }

  // Binary search
  for (iterations = 0; iterations < MAX_ITERATIONS; iterations++) {
    mid = (low + high) / 2;
    const fMid = evaluate(mid);

    if (isNaN(fMid)) {
      return { found: false, value: mid, iterations, finalResult: fMid };
    }

    const diff = fMid - targetValue;

    if (Math.abs(diff) < TOLERANCE) {
      return { found: true, value: mid, iterations, finalResult: fMid };
    }

    // Check direction: evaluate slightly above and below
    const fMidPlus = evaluate(mid + TOLERANCE * 100);
    const increasing = fMidPlus > fMid;

    if (increasing) {
      if (diff > 0) {
        high = mid;
      } else {
        low = mid;
      }
    } else {
      if (diff > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }

    if (Math.abs(high - low) < TOLERANCE * TOLERANCE) {
      break;
    }
  }

  const finalResult = evaluate(mid);
  return {
    found: Math.abs(finalResult - targetValue) < TOLERANCE,
    value: mid,
    iterations,
    finalResult,
  };
}

export function GoalSeekDialog() {
  const isOpen = useUIStore((s) => s.isGoalSeekDialogOpen);
  const close = useUIStore((s) => s.setGoalSeekDialogOpen);
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);

  const [setCellRef, setSetCellRef] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [changingCellRef, setChangingCellRef] = useState("");
  const [result, setResult] = useState<GoalSeekResult | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSeek = () => {
    setError("");
    setResult(null);

    if (!sheetId) return;

    let formulaPos: { row: number; col: number };
    let changingPos: { row: number; col: number };

    try {
      formulaPos = cellRefToPosition(setCellRef.trim());
    } catch {
      setError("Invalid Set Cell reference");
      return;
    }

    try {
      changingPos = cellRefToPosition(changingCellRef.trim());
    } catch {
      setError("Invalid Changing Cell reference");
      return;
    }

    const target = Number(targetValue);
    if (isNaN(target)) {
      setError("Target value must be a number");
      return;
    }

    // Verify the set cell has a formula
    const cellStore = useCellStore.getState();
    const formulaCell = cellStore.getCell(
      sheetId,
      formulaPos.row,
      formulaPos.col,
    );
    if (!formulaCell?.formula) {
      setError("Set Cell must contain a formula");
      return;
    }

    useHistoryStore.getState().pushUndo();

    const formulaCellKey = getCellKey(formulaPos.row, formulaPos.col);
    const seekResult = runGoalSeek(
      sheetId,
      formulaCellKey,
      target,
      changingPos.row,
      changingPos.col,
    );

    // Apply the result
    if (seekResult.found) {
      const existing = cellStore.getCell(
        sheetId,
        changingPos.row,
        changingPos.col,
      );
      cellStore.setCell(sheetId, changingPos.row, changingPos.col, {
        value: Math.round(seekResult.value * 1e10) / 1e10,
        format: existing?.format,
        comment: existing?.comment,
      });
    }

    setResult(seekResult);
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
      data-testid="goal-seek-overlay"
      onClick={() => close(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-96"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "384px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        data-testid="goal-seek-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Goal Seek
        </h2>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "4px",
            }}
          >
            Set cell (formula cell)
          </label>
          <input
            type="text"
            placeholder="e.g. B2"
            value={setCellRef}
            onChange={(e) => setSetCellRef(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              fontSize: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            data-testid="goal-seek-set-cell"
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
            To value
          </label>
          <input
            type="text"
            placeholder="e.g. 100"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              fontSize: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            data-testid="goal-seek-target-value"
          />
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
            By changing cell
          </label>
          <input
            type="text"
            placeholder="e.g. A1"
            value={changingCellRef}
            onChange={(e) => setChangingCellRef(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              fontSize: "13px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
            data-testid="goal-seek-changing-cell"
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: "12px",
              color: "#ef4444",
              marginBottom: "12px",
            }}
          >
            {error}
          </p>
        )}

        {result && (
          <div
            style={{
              padding: "12px",
              marginBottom: "12px",
              backgroundColor: result.found ? "#f0fdf4" : "#fef2f2",
              borderRadius: "6px",
              fontSize: "13px",
            }}
            data-testid="goal-seek-result"
          >
            {result.found ? (
              <>
                <p style={{ fontWeight: 600, color: "#16a34a" }}>
                  Solution found!
                </p>
                <p>Value: {Math.round(result.value * 1e10) / 1e10}</p>
                <p>Iterations: {result.iterations}</p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: "#dc2626" }}>
                  Could not find exact solution
                </p>
                <p>Closest value: {Math.round(result.value * 1e6) / 1e6}</p>
                <p>Result: {Math.round(result.finalResult * 1e6) / 1e6}</p>
                <p>Iterations: {result.iterations}</p>
              </>
            )}
          </div>
        )}

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
            data-testid="goal-seek-cancel"
            onClick={() => {
              setResult(null);
              setError("");
              close(false);
            }}
          >
            Close
          </button>
          <button
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "4px",
            }}
            data-testid="goal-seek-run"
            onClick={handleSeek}
          >
            Find
          </button>
        </div>
      </div>
    </div>
  );
}
