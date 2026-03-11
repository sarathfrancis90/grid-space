import { useState, useCallback } from "react";
import { useValidationStore } from "../../stores/validationStore";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import type {
  ValidationRule,
  ValidationRuleType,
  ValidationMode,
} from "../../types/grid";

interface DataValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RULE_TYPES: { value: ValidationRuleType; label: string }[] = [
  { value: "number-range", label: "Number range (decimal)" },
  { value: "whole-number", label: "Number range (whole)" },
  { value: "text-length", label: "Text length" },
  { value: "date-range", label: "Date range" },
  { value: "dropdown-list", label: "Dropdown list" },
  { value: "list-from-range", label: "List from range" },
  { value: "checkbox", label: "Checkbox" },
  { value: "custom-formula", label: "Custom formula" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #dadce0",
  borderRadius: 4,
  fontSize: 13,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  display: "block",
  marginBottom: 4,
};

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
  const [listRange, setListRange] = useState("");
  const [formula, setFormula] = useState("");
  const [allowBlank, setAllowBlank] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState<ValidationMode>("strict");
  const [inputMessage, setInputMessage] = useState("");
  const [showInputMessage, setShowInputMessage] = useState(false);

  const setRule = useValidationStore((s) => s.setRule);
  const removeRule = useValidationStore((s) => s.removeRule);
  const resolveListFromRange = useValidationStore(
    (s) => s.resolveListFromRange,
  );

  const handleApply = useCallback(() => {
    const selectedCell = useUIStore.getState().selectedCell;
    if (!selectedCell) return;
    const sheetId = useSpreadsheetStore.getState().activeSheetId;

    const rule: ValidationRule = {
      type: ruleType,
      allowBlank,
      errorMessage: errorMessage || undefined,
      mode,
      inputMessage: showInputMessage && inputMessage ? inputMessage : undefined,
    };

    switch (ruleType) {
      case "number-range":
      case "whole-number":
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
      case "list-from-range":
        rule.listRange = listRange;
        rule.listValues = resolveListFromRange(listRange);
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
    listRange,
    formula,
    allowBlank,
    errorMessage,
    mode,
    inputMessage,
    showInputMessage,
    setRule,
    resolveListFromRange,
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

  const showNumberFields =
    ruleType === "number-range" ||
    ruleType === "whole-number" ||
    ruleType === "text-length";

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
          minWidth: 400,
          maxWidth: 480,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Data Validation</h3>

        {/* Rule type selector */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Rule type
          </label>
          <select
            data-testid="validation-type-select"
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as ValidationRuleType)}
            style={inputStyle}
          >
            {RULE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Number range / whole number / text length fields */}
        {showNumberFields && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Min</label>
              <input
                data-testid="validation-min"
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Max</label>
              <input
                data-testid="validation-max"
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Date range fields */}
        {ruleType === "date-range" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start date</label>
              <input
                data-testid="validation-min-date"
                type="date"
                value={minDate}
                onChange={(e) => setMinDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End date</label>
              <input
                data-testid="validation-max-date"
                type="date"
                value={maxDate}
                onChange={(e) => setMaxDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Dropdown list (comma-separated) */}
        {ruleType === "dropdown-list" && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Values (comma-separated)</label>
            <input
              data-testid="validation-list-values"
              type="text"
              value={listValues}
              onChange={(e) => setListValues(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
              style={inputStyle}
            />
          </div>
        )}

        {/* List from range */}
        {ruleType === "list-from-range" && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Cell range</label>
            <input
              data-testid="validation-list-range"
              type="text"
              value={listRange}
              onChange={(e) => setListRange(e.target.value)}
              placeholder="Sheet1!A1:A10"
              style={inputStyle}
            />
            <span
              style={{
                fontSize: 11,
                color: "#5f6368",
                marginTop: 4,
                display: "block",
              }}
            >
              e.g. A1:A10 or Sheet2!B1:B20
            </span>
          </div>
        )}

        {/* Custom formula */}
        {ruleType === "custom-formula" && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Formula (must evaluate to TRUE)</label>
            <input
              data-testid="validation-formula"
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="=A1>0"
              style={inputStyle}
            />
          </div>
        )}

        {/* Strict vs Warning mode */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
            On invalid data
          </label>
          <div style={{ display: "flex", gap: 16 }}>
            <label
              data-testid="validation-mode-strict"
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="validationMode"
                value="strict"
                checked={mode === "strict"}
                onChange={() => setMode("strict")}
              />
              Reject input
            </label>
            <label
              data-testid="validation-mode-warning"
              style={{
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="validationMode"
                value="warning"
                checked={mode === "warning"}
                onChange={() => setMode("warning")}
              />
              Show warning
            </label>
          </div>
        </div>

        {/* Allow blank */}
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

        {/* Input message toggle + field */}
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
              data-testid="validation-show-input-msg"
              type="checkbox"
              checked={showInputMessage}
              onChange={(e) => setShowInputMessage(e.target.checked)}
            />
            Show input message when cell is selected
          </label>
          {showInputMessage && (
            <div style={{ marginTop: 8 }}>
              <input
                data-testid="validation-input-msg"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Enter a helpful hint for this cell"
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* Error message */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Error message (optional)</label>
          <input
            data-testid="validation-error-msg"
            type="text"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="Invalid input"
            style={inputStyle}
          />
        </div>

        {/* Action buttons */}
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
