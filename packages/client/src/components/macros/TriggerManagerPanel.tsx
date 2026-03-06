import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useMacroStore } from "../../stores/macroStore";
import {
  useTriggerStore,
  type TriggerEventType,
  type TriggerLogEntry,
} from "../../stores/triggerStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

const EVENT_TYPE_LABELS: Record<TriggerEventType, string> = {
  onEdit: "On Edit",
  onOpen: "On Open",
  onChange: "On Change",
  timeBased: "Time-based",
};

const INTERVAL_OPTIONS = [
  { label: "Every 1 minute", value: 1 },
  { label: "Every 5 minutes", value: 5 },
  { label: "Every 15 minutes", value: 15 },
  { label: "Every 30 minutes", value: 30 },
  { label: "Every 1 hour", value: 60 },
  { label: "Every 6 hours", value: 360 },
  { label: "Every 12 hours", value: 720 },
  { label: "Every 24 hours", value: 1440 },
];

export function TriggerManagerPanel() {
  const isOpen = useUIStore((s) => s.isTriggerManagerOpen);
  const closePanel = useUIStore((s) => s.setTriggerManagerOpen);
  const macros = useMacroStore((s) => s.macros);
  const triggers = useTriggerStore((s) => s.triggers);
  const addTrigger = useTriggerStore((s) => s.addTrigger);
  const updateTrigger = useTriggerStore((s) => s.updateTrigger);
  const removeTrigger = useTriggerStore((s) => s.removeTrigger);
  const selectedTriggerId = useTriggerStore((s) => s.selectedTriggerId);
  const setSelectedTrigger = useTriggerStore((s) => s.setSelectedTrigger);
  const logs = useTriggerStore((s) => s.logs);
  const setLogs = useTriggerStore((s) => s.setLogs);
  const spreadsheetId = useSpreadsheetStore((s) => s.spreadsheetId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMacroId, setNewMacroId] = useState("");
  const [newEventType, setNewEventType] = useState<TriggerEventType>("onEdit");
  const [newInterval, setNewInterval] = useState(60);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"triggers" | "logs">("triggers");

  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setConfirmDeleteId(null);
      setViewMode("triggers");
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    closePanel(false);
  }, [closePanel]);

  const handleAdd = useCallback(() => {
    if (!newMacroId || !spreadsheetId) return;

    const trigger = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      macroId: newMacroId,
      eventType: newEventType,
      isEnabled: true,
      intervalMinutes: newEventType === "timeBased" ? newInterval : null,
      lastFiredAt: null,
      nextFireAt: null,
      spreadsheetId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTrigger(trigger);
    setShowAddForm(false);
    setNewMacroId("");
    setNewEventType("onEdit");
  }, [newMacroId, newEventType, newInterval, spreadsheetId, addTrigger]);

  const handleToggle = useCallback(
    (id: string, currentEnabled: boolean) => {
      updateTrigger(id, { isEnabled: !currentEnabled });
    },
    [updateTrigger],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeTrigger(id);
      setConfirmDeleteId(null);
    },
    [removeTrigger],
  );

  const handleViewLogs = useCallback(
    (id: string) => {
      setSelectedTrigger(id);
      setLogs([], 0);
      setViewMode("logs");
    },
    [setSelectedTrigger, setLogs],
  );

  const getMacroName = useCallback(
    (macroId: string) => {
      const macro = macros.find((m) => m.id === macroId);
      return macro?.name ?? "Unknown Macro";
    },
    [macros],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="trigger-manager-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        data-testid="trigger-manager-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === "triggers" ? "Trigger Manager" : "Execution Logs"}
            </h2>
            {viewMode === "logs" && (
              <button
                onClick={() => setViewMode("triggers")}
                className="text-sm text-blue-500 hover:text-blue-700"
                data-testid="trigger-back-to-list"
                type="button"
              >
                Back to triggers
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="trigger-manager-close"
            type="button"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto px-6 py-4">
          {viewMode === "triggers" ? (
            <TriggerList
              triggers={triggers}
              getMacroName={getMacroName}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onViewLogs={handleViewLogs}
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
            />
          ) : (
            <LogList logs={logs} selectedTriggerId={selectedTriggerId} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          {viewMode === "triggers" && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={macros.length === 0}
              className="rounded bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              data-testid="trigger-add-new"
              type="button"
            >
              Add Trigger
            </button>
          )}

          {viewMode === "triggers" && showAddForm && (
            <AddTriggerForm
              macros={macros}
              newMacroId={newMacroId}
              setNewMacroId={setNewMacroId}
              newEventType={newEventType}
              setNewEventType={setNewEventType}
              newInterval={newInterval}
              setNewInterval={setNewInterval}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {viewMode === "triggers" && !showAddForm && (
            <button
              onClick={handleClose}
              className="rounded px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              data-testid="trigger-manager-done"
              type="button"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface TriggerListProps {
  triggers: Array<{
    id: string;
    macroId: string;
    eventType: TriggerEventType;
    isEnabled: boolean;
    intervalMinutes: number | null;
    createdAt: string;
  }>;
  getMacroName: (id: string) => string;
  onToggle: (id: string, currentEnabled: boolean) => void;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

function TriggerList({
  triggers,
  getMacroName,
  onToggle,
  onDelete,
  onViewLogs,
  confirmDeleteId,
  setConfirmDeleteId,
}: TriggerListProps) {
  if (triggers.length === 0) {
    return (
      <div
        className="py-12 text-center text-gray-500"
        data-testid="trigger-manager-empty"
      >
        <p className="text-base">No triggers configured.</p>
        <p className="mt-1 text-sm text-gray-400">
          Click &quot;Add Trigger&quot; to set up automated macro execution.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm" data-testid="trigger-manager-table">
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
          <th className="pb-2">Macro</th>
          <th className="pb-2">Event</th>
          <th className="pb-2">Interval</th>
          <th className="pb-2">Status</th>
          <th className="pb-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {triggers.map((trigger) => (
          <tr
            key={trigger.id}
            className="border-b border-gray-50 hover:bg-gray-50"
            data-testid={`trigger-row-${trigger.id}`}
          >
            <td className="py-2.5 font-medium text-gray-800">
              {getMacroName(trigger.macroId)}
            </td>
            <td className="py-2.5 text-gray-600">
              {EVENT_TYPE_LABELS[trigger.eventType]}
            </td>
            <td className="py-2.5 text-gray-500">
              {trigger.eventType === "timeBased" && trigger.intervalMinutes
                ? (INTERVAL_OPTIONS.find(
                    (o) => o.value === trigger.intervalMinutes,
                  )?.label ?? `${trigger.intervalMinutes}m`)
                : "-"}
            </td>
            <td className="py-2.5">
              <button
                onClick={() => onToggle(trigger.id, trigger.isEnabled)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  trigger.isEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
                data-testid={`trigger-toggle-${trigger.id}`}
                type="button"
              >
                {trigger.isEnabled ? "Enabled" : "Disabled"}
              </button>
            </td>
            <td className="py-2.5">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onViewLogs(trigger.id)}
                  className="rounded p-1 text-blue-500 hover:bg-blue-50"
                  title="View Logs"
                  data-testid={`trigger-logs-${trigger.id}`}
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {confirmDeleteId === trigger.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDelete(trigger.id)}
                      className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                      data-testid={`trigger-confirm-delete-${trigger.id}`}
                      type="button"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                      data-testid={`trigger-cancel-delete-${trigger.id}`}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(trigger.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                    data-testid={`trigger-delete-${trigger.id}`}
                    type="button"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface AddTriggerFormProps {
  macros: Array<{ id: string; name: string }>;
  newMacroId: string;
  setNewMacroId: (id: string) => void;
  newEventType: TriggerEventType;
  setNewEventType: (type: TriggerEventType) => void;
  newInterval: number;
  setNewInterval: (interval: number) => void;
  onAdd: () => void;
  onCancel: () => void;
}

function AddTriggerForm({
  macros,
  newMacroId,
  setNewMacroId,
  newEventType,
  setNewEventType,
  newInterval,
  setNewInterval,
  onAdd,
  onCancel,
}: AddTriggerFormProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={newMacroId}
        onChange={(e) => setNewMacroId(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        data-testid="trigger-macro-select"
      >
        <option value="">Select macro...</option>
        {macros.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <select
        value={newEventType}
        onChange={(e) => setNewEventType(e.target.value as TriggerEventType)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        data-testid="trigger-event-select"
      >
        {(Object.keys(EVENT_TYPE_LABELS) as TriggerEventType[]).map((type) => (
          <option key={type} value={type}>
            {EVENT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      {newEventType === "timeBased" && (
        <select
          value={newInterval}
          onChange={(e) => setNewInterval(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          data-testid="trigger-interval-select"
        >
          {INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={onAdd}
        disabled={!newMacroId}
        className="rounded bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
        data-testid="trigger-add-confirm"
        type="button"
      >
        Add
      </button>
      <button
        onClick={onCancel}
        className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
        data-testid="trigger-add-cancel"
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

interface LogListProps {
  logs: TriggerLogEntry[];
  selectedTriggerId: string | null;
}

function LogList({ logs, selectedTriggerId }: LogListProps) {
  if (!selectedTriggerId) {
    return (
      <div className="py-8 text-center text-gray-400">
        Select a trigger to view its execution logs.
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        className="py-8 text-center text-gray-400"
        data-testid="trigger-logs-empty"
      >
        No execution logs yet for this trigger.
      </div>
    );
  }

  return (
    <table className="w-full text-sm" data-testid="trigger-logs-table">
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
          <th className="pb-2">Time</th>
          <th className="pb-2">Status</th>
          <th className="pb-2">Message</th>
          <th className="pb-2">Duration</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr
            key={log.id}
            className="border-b border-gray-50"
            data-testid={`trigger-log-${log.id}`}
          >
            <td className="py-2 text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </td>
            <td className="py-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  log.status === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {log.status}
              </span>
            </td>
            <td className="max-w-xs truncate py-2 text-gray-600">
              {log.message ?? "-"}
            </td>
            <td className="py-2 text-gray-500">
              {log.durationMs != null ? `${log.durationMs}ms` : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
