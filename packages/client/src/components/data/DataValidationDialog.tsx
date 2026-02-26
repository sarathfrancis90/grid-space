import { useState, useCallback } from "react";
import { useValidationStore } from "../../stores/validationStore";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import type { ValidationRule, ValidationRuleType } from "../../types/grid";

interface DataValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RULE_TYPES: { value: ValidationRuleType; label: string }[] = [
  { value: "number-range", label: "Number range" },
  { value: "text-length", label: "Text length" },
  { value: "date-range", label: "Date range" },
  { value: "dropdown-list", label: "Dropdown list" },
  { value: "checkbox", label: "Checkbox" },
  { value: "custom-formula", label: "Custom formula" },
];

export function DataValidationDialog({
  isOpen,
  onClose,
}: DataValidationDialogProps) {
  const [ruleType, setRuleType] = useState<ValidationRuleType>("number-range");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [listValues, setListValues] = useState("");
  const [formula, setFormula] = useState("");
  const [allowBlank, setAllowBlank] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const setRule = useValidationStore((s) => s.setRule);
  const removeRule = useValidationStore((s) => s.removeRule);

  const handleApply = useCallback(() => {
    const selectedCell = useUIStore.getState().selectedCell;
    if (!selectedCell) return;
    const sheetId = useSpreadsheetStore.getState().activeSheetId;

    const rule: ValidationRule = {
      type: ruleType,
      allowBlank,
      errorMessage: errorMessage || undefined,
    };

    switch (ruleType) {
      case "number-range":
        if (min) rule.min = Number(min);
        if (max) rule.max = Number(max);
        break;
      case "text-length":
        if (min) rule.min = Number(min);
        if (max) rule.max = Number(max);
        break;
      case "date-range":
        if (minDate) rule.minDate = minDate;
        if (maxDate) rule.maxDate = maxDate;
        break;
      case "dropdown-list":
        rule.listValues = listValues
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        break;
      case "custom-formula":
        rule.formula = formula;
        break;
    }

    setRule(sheetId, selectedCell.row, selectedCell.col, rule);
    onClose();
  }, [
    ruleType,
    min,
    max,
    minDate,
    maxDate,
    listValues,
    formula,
    allowBlank,
    errorMessage,
    setRule,
    onClose,
  ]);

  const handleRemove = useCallback(() => {
    const selectedCell = useUIStore.getState().selectedCell;
    if (!selectedCell) return;
    const sheetId = useSpreadsheetStore.getState().activeSheetId;
    removeRule(sheetId, selectedCell.row, selectedCell.col);
    onClose();
  }, [removeRule, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="validation-dialog-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.3)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        data-testid="validation-dialog"
        style={{
          background: "white",
          borderRadius: 8,
          padding: 24,
          minWidth: 360,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Data Validation</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Rule type
          </label>
          <select
            data-testid="validation-type-select"
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as ValidationRuleType)}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {RULE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {(ruleType === "number-range" || ruleType === "text-length") && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                Min
              </label>
              <input
                data-testid="validation-min"
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #dadce0",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                Max
              </label>
              <input
                data-testid="validation-max"
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #dadce0",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        )}

        {ruleType === "date-range" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                Start date
              </label>
              <input
                data-testid="validation-min-date"
                type="date"
                value={minDate}
                onChange={(e) => setMinDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #dadce0",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontSize: 12, display: "block", marginBottom: 4 }}
              >
                End date
              </label>
              <input
                data-testid="validation-max-date"
                type="date"
                value={maxDate}
                onChange={(e) => setMaxDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #dadce0",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        )}

        {ruleType === "dropdown-list" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Values (comma-separated)
            </label>
            <input
              data-testid="validation-list-values"
              type="text"
              value={listValues}
              onChange={(e) => setListValues(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </div>
        )}

        {ruleType === "custom-formula" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Formula (must evaluate to TRUE)
            </label>
            <input
              data-testid="validation-formula"
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="=A1>0"
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1px solid #dadce0",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              data-testid="validation-allow-blank"
              type="checkbox"
              checked={allowBlank}
              onChange={(e) => setAllowBlank(e.target.checked)}
            />
            Allow blank
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
            Error message (optional)
          </label>
          <input
            data-testid="validation-error-msg"
            type="text"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="Invalid input"
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            data-testid="validation-remove-btn"
            onClick={handleRemove}
            style={{
              padding: "6px 16px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              background: "white",
              cursor: "pointer",
              fontSize: 13,
              color: "#d93025",
            }}
          >
            Remove
          </button>
          <button
            data-testid="validation-cancel-btn"
            onClick={onClose}
            style={{
              padding: "6px 16px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              background: "white",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            data-testid="validation-apply-btn"
            onClick={handleApply}
            style={{
              padding: "6px 16px",
              border: "none",
              borderRadius: 4,
              background: "#1a73e8",
              color: "white",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
