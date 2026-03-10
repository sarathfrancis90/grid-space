/**
 * NotificationRulesDialog — modal for managing per-spreadsheet notification rules.
 * Accessible from Tools > Notifications menu.
 * Allows creating rules like: notify on any changes, form submissions,
 * or changes by specific users, with immediate or daily digest frequency.
 */
import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import {
  useNotificationRuleStore,
  type NotificationRule,
  type TriggerType,
  type RuleFrequency,
} from "../../stores/notificationRuleStore";
import { api } from "../../services/api";

const TRIGGER_LABELS: Record<TriggerType, string> = {
  any_changes: "Any changes are made",
  user_submits_form: "A user submits a form",
  specific_user_changes: "Changes are made by a specific user",
};

const FREQUENCY_LABELS: Record<RuleFrequency, string> = {
  immediately: "Email - right away",
  daily_digest: "Email - daily digest",
};

export function NotificationRulesDialog() {
  const isOpen = useUIStore((s) => s.isNotificationRulesDialogOpen);
  const setOpen = useUIStore((s) => s.setNotificationRulesDialogOpen);
  const spreadsheetId = useSpreadsheetStore((s) => s.spreadsheetId);

  const rules = useNotificationRuleStore((s) => s.rules);
  const isLoading = useNotificationRuleStore((s) => s.isLoading);
  const setRules = useNotificationRuleStore((s) => s.setRules);
  const addRule = useNotificationRuleStore((s) => s.addRule);
  const removeRule = useNotificationRuleStore((s) => s.removeRule);
  const setLoading = useNotificationRuleStore((s) => s.setLoading);

  const [showAddForm, setShowAddForm] = useState(false);
  const [triggerType, setTriggerType] = useState<TriggerType>("any_changes");
  const [triggerEmail, setTriggerEmail] = useState("");
  const [frequency, setFrequency] = useState<RuleFrequency>("immediately");
  const [error, setError] = useState<string | null>(null);

  // Fetch rules when dialog opens
  useEffect(() => {
    if (!isOpen || !spreadsheetId) return;

    setLoading(true);
    setError(null);

    api
      .get<NotificationRule[]>(
        `/spreadsheets/${spreadsheetId}/notification-rules`,
      )
      .then((data) => {
        setRules(data);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen, spreadsheetId, setRules, setLoading]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setShowAddForm(false);
    setError(null);
    setTriggerType("any_changes");
    setTriggerEmail("");
    setFrequency("immediately");
  }, [setOpen]);

  const handleAddRule = useCallback(async () => {
    if (!spreadsheetId) return;

    if (triggerType === "specific_user_changes" && !triggerEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    try {
      setError(null);
      const rule = await api.post<NotificationRule>(
        `/spreadsheets/${spreadsheetId}/notification-rules`,
        {
          triggerType,
          triggerEmail:
            triggerType === "specific_user_changes"
              ? triggerEmail.trim()
              : null,
          frequency,
        },
      );
      addRule(rule);
      setShowAddForm(false);
      setTriggerType("any_changes");
      setTriggerEmail("");
      setFrequency("immediately");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create rule";
      setError(message);
    }
  }, [spreadsheetId, triggerType, triggerEmail, frequency, addRule]);

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      if (!spreadsheetId) return;

      try {
        await api.delete(
          `/spreadsheets/${spreadsheetId}/notification-rules/${ruleId}`,
        );
        removeRule(ruleId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete rule";
        setError(message);
      }
    },
    [spreadsheetId, removeRule],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="notification-rules-dialog"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Notification rules
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="notification-rules-close"
            type="button"
            aria-label="Close"
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

        {/* Content */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {error && (
            <div
              className="mb-3 px-3 py-2 bg-red-50 text-red-700 text-sm rounded"
              data-testid="notification-rules-error"
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Loading rules...
            </div>
          ) : rules.length === 0 && !showAddForm ? (
            <div
              className="py-8 text-center text-sm text-gray-400"
              data-testid="no-notification-rules"
            >
              No notification rules yet. Add a rule to get notified about
              changes to this spreadsheet.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          )}

          {/* Add form */}
          {showAddForm && (
            <div
              className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              data-testid="notification-rule-add-form"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notify me when...
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) =>
                      setTriggerType(e.target.value as TriggerType)
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    data-testid="notification-rule-trigger-select"
                  >
                    {(
                      Object.entries(TRIGGER_LABELS) as [TriggerType, string][]
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {triggerType === "specific_user_changes" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User email
                    </label>
                    <input
                      type="email"
                      value={triggerEmail}
                      onChange={(e) => setTriggerEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      data-testid="notification-rule-email-input"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notify me with...
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as RuleFrequency)
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    data-testid="notification-rule-frequency-select"
                  >
                    {(
                      Object.entries(FREQUENCY_LABELS) as [
                        RuleFrequency,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    type="button"
                    data-testid="notification-rule-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRule}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    type="button"
                    data-testid="notification-rule-save-btn"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              type="button"
              data-testid="notification-rule-add-btn"
            >
              + Add notification rule
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            type="button"
            data-testid="notification-rules-done-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface RuleRowProps {
  rule: NotificationRule;
  onDelete: (id: string) => void;
}

function RuleRow({ rule, onDelete }: RuleRowProps) {
  const triggerLabel = TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType;
  const frequencyLabel = FREQUENCY_LABELS[rule.frequency] ?? rule.frequency;

  return (
    <div
      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border border-gray-200"
      data-testid={`notification-rule-row-${rule.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 truncate">
          {triggerLabel}
          {rule.triggerType === "specific_user_changes" &&
            rule.triggerEmail && (
              <span className="text-gray-500 ml-1">({rule.triggerEmail})</span>
            )}
        </div>
        <div className="text-xs text-gray-500">{frequencyLabel}</div>
      </div>
      <button
        onClick={() => onDelete(rule.id)}
        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        type="button"
        data-testid={`notification-rule-delete-${rule.id}`}
        aria-label="Delete rule"
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
