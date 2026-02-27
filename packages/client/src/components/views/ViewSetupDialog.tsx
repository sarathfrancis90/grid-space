import { useState, useCallback } from "react";
import type { ViewType } from "../../types/views";

interface ColumnOption {
  index: number;
  label: string;
}

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
}

const VIEW_FIELDS: Record<string, FieldDef[]> = {
  kanban: [
    { key: "statusCol", label: "Status Column (lanes)", required: true },
    { key: "titleCol", label: "Title Column (card title)", required: true },
    { key: "descCol", label: "Description Column", required: false },
    { key: "colorCol", label: "Color Column", required: false },
  ],
  timeline: [
    { key: "startDateCol", label: "Start Date Column", required: true },
    { key: "endDateCol", label: "End Date Column", required: false },
    { key: "titleCol", label: "Title Column", required: true },
    { key: "colorCol", label: "Color Column", required: false },
  ],
  calendar: [
    { key: "dateCol", label: "Date Column", required: true },
    { key: "titleCol", label: "Title Column", required: true },
    { key: "colorCol", label: "Color Column", required: false },
  ],
};

interface ViewSetupDialogProps {
  viewType: Exclude<ViewType, "grid">;
  headers: string[];
  onApply: (config: Record<string, number | null>) => void;
  onCancel: () => void;
}

export function ViewSetupDialog({
  viewType,
  headers,
  onApply,
  onCancel,
}: ViewSetupDialogProps) {
  const fields = VIEW_FIELDS[viewType];
  const columns: ColumnOption[] = headers.map((label, index) => ({
    index,
    label,
  }));

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of fields) {
      init[field.key] = field.required && columns.length > 0 ? "0" : "";
    }
    return init;
  });

  const handleChange = useCallback((key: string, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(() => {
    const config: Record<string, number | null> = {};
    for (const field of fields) {
      const val = selections[field.key];
      config[field.key] = val !== "" ? parseInt(val, 10) : null;
    }
    onApply(config);
  }, [fields, selections, onApply]);

  const isValid = fields
    .filter((f) => f.required)
    .every((f) => selections[f.key] !== "");

  const title =
    viewType === "kanban"
      ? "Kanban Setup"
      : viewType === "timeline"
        ? "Timeline Setup"
        : "Calendar Setup";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30"
      data-testid="view-setup-backdrop"
      onClick={onCancel}
    >
      <div
        className="w-[400px] rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="view-setup-dialog"
      >
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">
            Map your spreadsheet columns to configure this view.
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {field.label}
                {field.required && (
                  <span className="ml-0.5 text-red-500">*</span>
                )}
              </label>
              <select
                value={selections[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                data-testid={`setup-select-${field.key}`}
              >
                {!field.required && <option value="">— None —</option>}
                {columns.map((col) => (
                  <option key={col.index} value={col.index}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            data-testid="setup-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!isValid}
            className="rounded bg-[#1a73e8] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1765cc] disabled:opacity-50"
            data-testid="setup-apply-btn"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
