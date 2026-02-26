/**
 * ConditionalFormatManager — UI for adding, editing, deleting, and reordering
 * conditional formatting rules per sheet.
 * S6-023: Conditional format manager
 */
import { useState, useCallback } from "react";
import { useFormatStore } from "../../stores/formatStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useUIStore } from "../../stores/uiStore";
import type { ConditionalRule, CellFormat } from "../../types/grid";

const RULE_TYPES = [
  { value: "value", label: "Value" },
  { value: "text", label: "Text" },
  { value: "blank", label: "Blank / Not Blank" },
  { value: "date", label: "Date" },
  { value: "customFormula", label: "Custom Formula" },
  { value: "colorScale", label: "Color Scale" },
] as const;

const VALUE_CONDITIONS = [
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" },
  { value: "equalTo", label: "Equal to" },
  { value: "between", label: "Between" },
  { value: "notBetween", label: "Not between" },
];

const TEXT_CONDITIONS = [
  { value: "contains", label: "Contains" },
  { value: "notContains", label: "Does not contain" },
  { value: "startsWith", label: "Starts with" },
  { value: "endsWith", label: "Ends with" },
  { value: "exactMatch", label: "Exact match" },
];

const BLANK_CONDITIONS = [
  { value: "isBlank", label: "Is blank" },
  { value: "notBlank", label: "Is not blank" },
];

const DATE_CONDITIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "lastWeek", label: "Last 7 days" },
  { value: "thisWeek", label: "This week" },
  { value: "nextWeek", label: "Next week" },
  { value: "pastMonth", label: "Past month" },
];

interface ConditionalFormatManagerProps {
  open: boolean;
  onClose: () => void;
}

export function ConditionalFormatManager({
  open,
  onClose,
}: ConditionalFormatManagerProps) {
  const sheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const rules = useFormatStore((s) => s.getConditionalRules(sheetId));
  const addRule = useFormatStore((s) => s.addConditionalRule);
  const removeRule = useFormatStore((s) => s.removeConditionalRule);
  const reorderRules = useFormatStore((s) => s.reorderConditionalRules);
  const selections = useUIStore((s) => s.selections);
  const [newRuleType, setNewRuleType] = useState<string>("value");
  const [newCondition, setNewCondition] = useState("greaterThan");
  const [newValue1, setNewValue1] = useState("");
  const [newValue2, setNewValue2] = useState("");
  const [newFormula, setNewFormula] = useState("");
  const [newBgColor, setNewBgColor] = useState("#b7e1cd");

  const getSelectionRange = useCallback(() => {
    if (selections.length === 0)
      return { startRow: 0, startCol: 0, endRow: 99, endCol: 25 };
    const sel = selections[selections.length - 1];
    return {
      startRow: Math.min(sel.start.row, sel.end.row),
      startCol: Math.min(sel.start.col, sel.end.col),
      endRow: Math.max(sel.start.row, sel.end.row),
      endCol: Math.max(sel.start.col, sel.end.col),
    };
  }, [selections]);

  const handleAddRule = useCallback(() => {
    const range = getSelectionRange();
    const format: Partial<CellFormat> = { backgroundColor: newBgColor };
    const rule: ConditionalRule = {
      id: `cfrule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      range,
      type: newRuleType as ConditionalRule["type"],
      condition: newCondition,
      values: newValue2 ? [newValue1, newValue2] : [newValue1],
      format,
      priority: rules.length,
      formula: newRuleType === "customFormula" ? newFormula : undefined,
    };
    addRule(sheetId, rule);
    setNewValue1("");
    setNewValue2("");
    setNewFormula("");
  }, [
    sheetId,
    newRuleType,
    newCondition,
    newValue1,
    newValue2,
    newFormula,
    newBgColor,
    rules.length,
    addRule,
    getSelectionRange,
  ]);

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      removeRule(sheetId, ruleId);
    },
    [sheetId, removeRule],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const ids = rules.map((r) => r.id);
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      reorderRules(sheetId, ids);
    },
    [sheetId, rules, reorderRules],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= rules.length - 1) return;
      const ids = rules.map((r) => r.id);
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
      reorderRules(sheetId, ids);
    },
    [sheetId, rules, reorderRules],
  );

  const getConditionsForType = (type: string) => {
    switch (type) {
      case "value":
        return VALUE_CONDITIONS;
      case "text":
        return TEXT_CONDITIONS;
      case "blank":
        return BLANK_CONDITIONS;
      case "date":
        return DATE_CONDITIONS;
      default:
        return [];
    }
  };

  if (!open) return null;

  return (
    <div
      data-testid="conditional-format-manager"
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-sm font-semibold">
            Conditional Formatting Rules
          </h2>
          <button
            data-testid="cf-manager-close"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Add new rule form */}
        <div className="p-4 border-b space-y-2">
          <div className="flex gap-2">
            <select
              data-testid="cf-type-select"
              value={newRuleType}
              onChange={(e) => {
                setNewRuleType(e.target.value);
                const conds = getConditionsForType(e.target.value);
                if (conds.length > 0) setNewCondition(conds[0].value);
              }}
              className="flex-1 h-8 border border-gray-300 rounded text-xs px-2"
            >
              {RULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {getConditionsForType(newRuleType).length > 0 && (
              <select
                data-testid="cf-condition-select"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="flex-1 h-8 border border-gray-300 rounded text-xs px-2"
              >
                {getConditionsForType(newRuleType).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2">
            {(newRuleType === "value" || newRuleType === "text") && (
              <input
                data-testid="cf-value1-input"
                type="text"
                value={newValue1}
                onChange={(e) => setNewValue1(e.target.value)}
                placeholder="Value"
                className="flex-1 h-8 border border-gray-300 rounded text-xs px-2"
              />
            )}
            {newRuleType === "value" &&
              (newCondition === "between" || newCondition === "notBetween") && (
                <input
                  data-testid="cf-value2-input"
                  type="text"
                  value={newValue2}
                  onChange={(e) => setNewValue2(e.target.value)}
                  placeholder="Value 2"
                  className="flex-1 h-8 border border-gray-300 rounded text-xs px-2"
                />
              )}
            {newRuleType === "customFormula" && (
              <input
                data-testid="cf-formula-input"
                type="text"
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                placeholder="e.g., >10"
                className="flex-1 h-8 border border-gray-300 rounded text-xs px-2"
              />
            )}

            <input
              data-testid="cf-bg-color-input"
              type="color"
              value={newBgColor}
              onChange={(e) => setNewBgColor(e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded"
            />

            <button
              data-testid="cf-add-rule-btn"
              onClick={handleAddRule}
              className="px-3 h-8 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              type="button"
            >
              Add
            </button>
          </div>
        </div>

        {/* Rules list */}
        <div className="flex-1 overflow-y-auto p-2">
          {rules.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              No rules configured
            </p>
          )}
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              data-testid={`cf-rule-${rule.id}`}
              className="flex items-center gap-2 p-2 border-b border-gray-100 text-xs"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  data-testid={`cf-move-up-${rule.id}`}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  type="button"
                >
                  ▲
                </button>
                <button
                  data-testid={`cf-move-down-${rule.id}`}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === rules.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  type="button"
                >
                  ▼
                </button>
              </div>
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{
                  backgroundColor: rule.format.backgroundColor ?? "#fff",
                }}
              />
              <div className="flex-1 truncate">
                <span className="font-medium">{rule.type}</span>
                {" — "}
                <span>{rule.condition}</span>
                {rule.values.length > 0 && rule.values[0] !== "" && (
                  <span> ({rule.values.join(", ")})</span>
                )}
                {rule.formula && <span> [{rule.formula}]</span>}
              </div>
              <button
                data-testid={`cf-delete-${rule.id}`}
                onClick={() => handleRemoveRule(rule.id)}
                className="text-red-500 hover:text-red-700"
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t flex justify-end">
          <button
            data-testid="cf-manager-done"
            onClick={onClose}
            className="px-4 h-8 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
