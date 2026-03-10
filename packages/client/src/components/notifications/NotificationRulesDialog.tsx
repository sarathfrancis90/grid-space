/**
 * NotificationRulesDialog — configure per-spreadsheet notification rules.
 * Accessible from Tools > Notifications.
 * Google Sheets parity: Tools > Notification rules.
 */
import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import {
  useNotificationRuleStore,
  type NotificationRule,
  type TriggerType,
  type Frequency,
} from "../../stores/notificationRuleStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  any_changes: "Any changes are made",
  form_submit: "A user submits a form",
  specific_user: "Changes are made by a specific user",
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  immediately: "Email — right away",
  daily_digest: "Email — daily digest",
};

interface RuleRowProps {
  rule: NotificationRule;
  onUpdate: (id: string, updates: Partial<NotificationRule>) => void;
  onDelete: (id: string) => void;
}

function RuleRow({ rule, onUpdate, onDelete }: RuleRowProps) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-3 border-b border-gray-100 last:border-0"
      data-testid={`notification-rule-${rule.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">
          {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}
        </p>
        {rule.triggerType === "specific_user" && rule.specificEmail && (
          <p className="text-xs text-gray-500 mt-0.5">{rule.specificEmail}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {FREQUENCY_LABELS[rule.frequency] ?? rule.frequency}
        </p>
      </div>

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={rule.isActive}
          onChange={(e) => onUpdate(rule.id, { isActive: e.target.checked })}
          className="rounded text-blue-600"
          data-testid={`rule-toggle-${rule.id}`}
        />
        <span className="text-xs text-gray-500">Active</span>
      </label>

      <button
        onClick={() => onDelete(rule.id)}
        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
        title="Delete rule"
        data-testid={`rule-delete-${rule.id}`}
        type="button"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

export function NotificationRulesDialog() {
  const isOpen = useUIStore((s) => s.isNotificationRulesDialogOpen);
  const closeDialog = useUIStore((s) => s.setNotificationRulesDialogOpen);
  const rules = useNotificationRuleStore((s) => s.rules);
  const addRule = useNotificationRuleStore((s) => s.addRule);
  const updateRule = useNotificationRuleStore((s) => s.updateRule);
  const removeRule = useNotificationRuleStore((s) => s.removeRule);
  const spreadsheetId = useSpreadsheetStore((s) => s.id);

  const [isAdding, setIsAdding] = useState(false);
  const [newTrigger, setNewTrigger] = useState<TriggerType>("any_changes");
  const [newFrequency, setNewFrequency] = useState<Frequency>("immediately");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsAdding(false);
      setNewTrigger("any_changes");
      setNewFrequency("immediately");
      setNewEmail("");
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    closeDialog(false);
  }, [closeDialog]);

  const handleAddRule = useCallback(() => {
    if (newTrigger === "specific_user" && !newEmail.trim()) return;

    const rule: NotificationRule = {
      id: `local-${Date.now()}`,
      userId: "",
      spreadsheetId: spreadsheetId ?? "",
      triggerType: newTrigger,
      specificEmail: newTrigger === "specific_user" ? newEmail.trim() : null,
      frequency: newFrequency,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addRule(rule);
    setIsAdding(false);
    setNewTrigger("any_changes");
    setNewFrequency("immediately");
    setNewEmail("");
  }, [newTrigger, newFrequency, newEmail, spreadsheetId, addRule]);

  const handleUpdate = useCallback(
    (id: string, updates: Partial<NotificationRule>) => {
      updateRule(id, updates);
    },
    [updateRule],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeRule(id);
    },
    [removeRule],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
      data-testid="notification-rules-dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4"
        data-testid="notification-rules-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Notification rules
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            data-testid="notification-rules-close"
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          {rules.length === 0 && !isAdding && (
            <p
              className="text-sm text-gray-400 text-center py-6"
              data-testid="no-notification-rules"
            >
              No notification rules yet. Add one to get notified about changes
              to this spreadsheet.
            </p>
          )}

          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}

          {/* Add new rule form */}
          {isAdding && (
            <div
              className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              data-testid="add-rule-form"
            >
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notify me when...
                </label>
                <select
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value as TriggerType)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="rule-trigger-select"
                >
                  <option value="any_changes">Any changes are made</option>
                  <option value="form_submit">A user submits a form</option>
                  <option value="specific_user">
                    Changes are made by a specific user
                  </option>
                </select>
              </div>

              {newTrigger === "specific_user" && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    User email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="rule-email-input"
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notification frequency
                </label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value as Frequency)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="rule-frequency-select"
                >
                  <option value="immediately">Email — right away</option>
                  <option value="daily_digest">Email — daily digest</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                  data-testid="rule-cancel-btn"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRule}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  data-testid="rule-save-btn"
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md font-medium"
              data-testid="add-rule-btn"
              type="button"
            >
              + Add rule
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            data-testid="notification-rules-done-btn"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
