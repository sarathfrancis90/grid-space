/**
 * ConditionalFormatManager — UI for adding, editing, deleting, and reordering
 * conditional formatting rules per sheet.
 * S6-023: Conditional format manager
 */
import { useState, useCallback, useMemo, useRef } from "react";
import { useFormatStore } from "../../stores/formatStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useUIStore } from "../../stores/uiStore";
import type {
  ConditionalRule,
  CellFormat,
  IconSetStyle,
} from "../../types/grid";

const EMPTY_RULES: ConditionalRule[] = [];

const RULE_TYPES = [
  { value: "value", label: "Value" },
  { value: "text", label: "Text" },
  { value: "blank", label: "Blank / Not Blank" },
  { value: "date", label: "Date" },
  { value: "customFormula", label: "Custom Formula" },
  { value: "colorScale", label: "Color Scale" },
  { value: "dataBar", label: "Data Bar" },
  { value: "iconSet", label: "Icon Set" },
] as const;

const ICON_SET_STYLES: { value: IconSetStyle; label: string }[] = [
  { value: "3-arrows", label: "3 Arrows" },
  { value: "3-flags", label: "3 Flags" },
  { value: "3-traffic-lights", label: "3 Traffic Lights" },
  { value: "4-arrows", label: "4 Arrows" },
  { value: "5-arrows", label: "5 Arrows" },
];

const DATA_BAR_FILL_TYPES = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
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

interface QuickRuleDef {
  label: string;
  type: ConditionalRule["type"];
  condition: string;
  format: Partial<CellFormat>;
}

const QUICK_RULES: QuickRuleDef[] = [
  {
    label: "Highlight duplicates",
    type: "customFormula",
    condition: "duplicates",
    format: { backgroundColor: "#fce8e6", textColor: "#c5221f" },
  },
  {
    label: "Highlight unique",
    type: "customFormula",
    condition: "unique",
    format: { backgroundColor: "#e6f4ea", textColor: "#137333" },
  },
  {
    label: "Highlight blanks",
    type: "blank",
    condition: "isBlank",
    format: { backgroundColor: "#fef7e0", textColor: "#b05a00" },
  },
  {
    label: "Highlight non-blanks",
    type: "blank",
    condition: "notBlank",
    format: { backgroundColor: "#e8f0fe", textColor: "#1a73e8" },
  },
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
  const conditionalRulesMap = useFormatStore((s) => s.conditionalRules);
  const rules = useMemo(
    () =>
      sheetId ? (conditionalRulesMap.get(sheetId) ?? EMPTY_RULES) : EMPTY_RULES,
    [sheetId, conditionalRulesMap],
  );
  const addRule = useFormatStore((s) => s.addConditionalRule);
  const removeRule = useFormatStore((s) => s.removeConditionalRule);
  const updateRule = useFormatStore((s) => s.updateConditionalRule);
  const reorderRules = useFormatStore((s) => s.reorderConditionalRules);
  const selections = useUIStore((s) => s.selections);
  const [newRuleType, setNewRuleType] = useState<string>("value");
  const [newCondition, setNewCondition] = useState("greaterThan");
  const [newValue1, setNewValue1] = useState("");
  const [newValue2, setNewValue2] = useState("");
  const [newFormula, setNewFormula] = useState("");
  const [newBgColor, setNewBgColor] = useState("#b7e1cd");
  const [dataBarColor, setDataBarColor] = useState("#4285f4");
  const [dataBarFill, setDataBarFill] = useState<"solid" | "gradient">("solid");
  const [dataBarNegative, setDataBarNegative] = useState(false);
  const [dataBarNegColor, setDataBarNegColor] = useState("#ea4335");
  const [iconSetStyle, setIconSetStyle] = useState<IconSetStyle>("3-arrows");

  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

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
    if (newRuleType === "dataBar") {
      rule.dataBarConfig = {
        color: dataBarColor,
        fillType: dataBarFill,
        showNegative: dataBarNegative,
        negativeColor: dataBarNegColor,
      };
    }
    if (newRuleType === "iconSet") {
      rule.iconSetConfig = {
        style: iconSetStyle,
        thresholds: [],
      };
    }
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
    dataBarColor,
    dataBarFill,
    dataBarNegative,
    dataBarNegColor,
    iconSetStyle,
    rules.length,
    addRule,
    getSelectionRange,
  ]);

  const handleAddQuickRule = useCallback(
    (quickRule: QuickRuleDef) => {
      const range = getSelectionRange();
      const rule: ConditionalRule = {
        id: `cfrule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        range,
        type: quickRule.type,
        condition: quickRule.condition,
        values: [],
        format: quickRule.format,
        priority: rules.length,
      };
      addRule(sheetId, rule);
    },
    [sheetId, rules.length, addRule, getSelectionRange],
  );

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      removeRule(sheetId, ruleId);
    },
    [sheetId, removeRule],
  );

  const handleToggleStopIfTrue = useCallback(
    (ruleId: string, current: boolean) => {
      updateRule(sheetId, ruleId, { stopIfTrue: !current });
    },
    [sheetId, updateRule],
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

  const handleDragStart = useCallback((index: number) => {
    dragItemRef.current = index;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      dragOverRef.current = index;
    },
    [],
  );

  const handleDrop = useCallback(() => {
    const dragIdx = dragItemRef.current;
    const dropIdx = dragOverRef.current;
    if (dragIdx === null || dropIdx === null || dragIdx === dropIdx) {
      dragItemRef.current = null;
      dragOverRef.current = null;
      return;
    }
    const ids = rules.map((r) => r.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(dropIdx, 0, moved);
    reorderRules(sheetId, ids);
    dragItemRef.current = null;
    dragOverRef.current = null;
  }, [sheetId, rules, reorderRules]);

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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[540px] max-h-[80vh] flex flex-col"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "540px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ fontSize: "18px", fontWeight: 600 }}
          >
            Conditional Formatting Rules
          </h2>
          <button
            data-testid="cf-manager-close"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            &#10005;
          </button>
        </div>

        {/* Quick rules */}
        <div
          className="px-4 pt-3 pb-1"
          style={{ padding: "12px 16px 4px 16px" }}
        >
          <div
            className="flex items-center gap-2 flex-wrap"
            style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
          >
            <span
              className="text-xs text-gray-500 font-medium"
              style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}
            >
              Quick rules:
            </span>
            {QUICK_RULES.map((qr) => (
              <button
                key={qr.label}
                data-testid={`cf-quick-${qr.condition}`}
                onClick={() => handleAddQuickRule(qr)}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                style={{
                  fontSize: "11px",
                  padding: "3px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: qr.format.backgroundColor,
                  color: qr.format.textColor ?? "#333",
                }}
                type="button"
              >
                {qr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add new rule form */}
        <div
          className="p-4 border-b space-y-2"
          style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}
        >
          <div className="flex gap-2" style={{ display: "flex", gap: "8px" }}>
            <select
              data-testid="cf-type-select"
              value={newRuleType}
              onChange={(e) => {
                setNewRuleType(e.target.value);
                const conds = getConditionsForType(e.target.value);
                if (conds.length > 0) setNewCondition(conds[0].value);
              }}
              className="flex-1 h-8 border border-gray-300 rounded text-xs px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                flex: 1,
                height: "32px",
                padding: "0 8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "12px",
              }}
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
                className="flex-1 h-8 border border-gray-300 rounded text-xs px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  flex: 1,
                  height: "32px",
                  padding: "0 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                {getConditionsForType(newRuleType).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2" style={{ display: "flex", gap: "8px" }}>
            {(newRuleType === "value" || newRuleType === "text") && (
              <input
                data-testid="cf-value1-input"
                type="text"
                value={newValue1}
                onChange={(e) => setNewValue1(e.target.value)}
                placeholder="Value"
                className="flex-1 h-8 border border-gray-300 rounded text-xs px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  flex: 1,
                  height: "32px",
                  padding: "0 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
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
                  className="flex-1 h-8 border border-gray-300 rounded text-xs px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    flex: 1,
                    height: "32px",
                    padding: "0 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                />
              )}
            {newRuleType === "customFormula" && (
              <input
                data-testid="cf-formula-input"
                type="text"
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                placeholder="e.g., >10"
                className="flex-1 h-8 border border-gray-300 rounded text-xs px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  flex: 1,
                  height: "32px",
                  padding: "0 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              />
            )}

            {newRuleType === "dataBar" && (
              <>
                <input
                  data-testid="cf-databar-color"
                  type="color"
                  value={dataBarColor}
                  onChange={(e) => setDataBarColor(e.target.value)}
                  title="Bar color"
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                  }}
                />
                <select
                  data-testid="cf-databar-fill"
                  value={dataBarFill}
                  onChange={(e) =>
                    setDataBarFill(e.target.value as "solid" | "gradient")
                  }
                  style={{
                    height: "32px",
                    padding: "0 8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {DATA_BAR_FILL_TYPES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                  }}
                >
                  <input
                    data-testid="cf-databar-negative"
                    type="checkbox"
                    checked={dataBarNegative}
                    onChange={(e) => setDataBarNegative(e.target.checked)}
                  />
                  Neg
                </label>
                {dataBarNegative && (
                  <input
                    data-testid="cf-databar-neg-color"
                    type="color"
                    value={dataBarNegColor}
                    onChange={(e) => setDataBarNegColor(e.target.value)}
                    title="Negative bar color"
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                    }}
                  />
                )}
              </>
            )}

            {newRuleType === "iconSet" && (
              <select
                data-testid="cf-iconset-style"
                value={iconSetStyle}
                onChange={(e) =>
                  setIconSetStyle(e.target.value as IconSetStyle)
                }
                style={{
                  flex: 1,
                  height: "32px",
                  padding: "0 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                {ICON_SET_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}

            <input
              data-testid="cf-bg-color-input"
              type="color"
              value={newBgColor}
              onChange={(e) => setNewBgColor(e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded"
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            />

            <button
              data-testid="cf-add-rule-btn"
              onClick={handleAddRule}
              className="px-3 h-8 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              style={{
                padding: "0 12px",
                height: "32px",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "4px",
                fontSize: "12px",
              }}
              type="button"
            >
              Add
            </button>
          </div>
        </div>

        {/* Rules list */}
        <div
          className="flex-1 overflow-y-auto p-2"
          style={{ flex: 1, overflowY: "auto", padding: "8px" }}
        >
          {rules.length === 0 && (
            <p
              className="text-xs text-gray-400 text-center py-4"
              style={{
                textAlign: "center",
                padding: "16px 0",
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              No rules configured
            </p>
          )}
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              data-testid={`cf-rule-${rule.id}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className="flex items-center gap-2 p-2 border-b border-gray-100 text-xs"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                borderBottom: "1px solid #f3f4f6",
                fontSize: "12px",
                cursor: "grab",
              }}
            >
              <div
                className="flex flex-col gap-0.5"
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <button
                  data-testid={`cf-move-up-${rule.id}`}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  type="button"
                >
                  &#9650;
                </button>
                <button
                  data-testid={`cf-move-down-${rule.id}`}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === rules.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  type="button"
                >
                  &#9660;
                </button>
              </div>
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  backgroundColor: rule.format.backgroundColor ?? "#fff",
                }}
              />
              <div
                className="flex-1 truncate"
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span className="font-medium">{rule.type}</span>
                {" — "}
                <span>{rule.condition}</span>
                {rule.values.length > 0 && rule.values[0] !== "" && (
                  <span> ({rule.values.join(", ")})</span>
                )}
                {rule.formula && <span> [{rule.formula}]</span>}
                {rule.dataBarConfig && (
                  <span> [{rule.dataBarConfig.fillType}]</span>
                )}
                {rule.iconSetConfig && (
                  <span> [{rule.iconSetConfig.style}]</span>
                )}
              </div>
              <label
                data-testid={`cf-stop-if-true-${rule.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={rule.stopIfTrue ?? false}
                  onChange={() =>
                    handleToggleStopIfTrue(rule.id, rule.stopIfTrue ?? false)
                  }
                  style={{ margin: 0 }}
                />
                Stop
              </label>
              <button
                data-testid={`cf-delete-${rule.id}`}
                onClick={() => handleRemoveRule(rule.id)}
                className="text-red-500 hover:text-red-700"
                type="button"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>

        <div
          className="p-4 border-t flex justify-end"
          style={{
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            data-testid="cf-manager-done"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
            }}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
