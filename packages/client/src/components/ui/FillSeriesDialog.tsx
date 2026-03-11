/**
 * FillSeriesDialog — dialog for configuring Fill Series options.
 * Allows users to choose linear/growth/date series with step and stop values.
 */
import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { fillSeries } from "../../utils/fillOperations";
import type { FillSeriesOptions } from "../../utils/fillOperations";

export function FillSeriesDialog() {
  const isOpen = useUIStore((s) => s.isFillSeriesDialogOpen);
  const [seriesType, setSeriesType] = useState<"linear" | "growth" | "date">(
    "linear",
  );
  const [stepValue, setStepValue] = useState("1");
  const [stopValue, setStopValue] = useState("");

  const handleClose = useCallback(() => {
    useUIStore.getState().setFillSeriesDialogOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    const options: FillSeriesOptions = {
      type: seriesType,
      stepValue: parseFloat(stepValue) || 1,
      stopValue: stopValue ? parseFloat(stopValue) : null,
    };
    fillSeries(options);
    handleClose();
  }, [seriesType, stepValue, stopValue, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
      data-testid="fill-series-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[360px] p-6"
        data-testid="fill-series-dialog"
      >
        <h2 className="text-base font-medium text-gray-900 mb-4">
          Fill Series
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Series type
            </label>
            <select
              data-testid="fill-series-type"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              value={seriesType}
              onChange={(e) =>
                setSeriesType(e.target.value as "linear" | "growth" | "date")
              }
            >
              <option value="linear">Linear</option>
              <option value="growth">Growth</option>
              <option value="date">Date</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Step value
            </label>
            <input
              data-testid="fill-series-step"
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              value={stepValue}
              onChange={(e) => setStepValue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Stop value (optional)
            </label>
            <input
              data-testid="fill-series-stop"
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
              value={stopValue}
              onChange={(e) => setStopValue(e.target.value)}
              placeholder="No limit"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            data-testid="fill-series-cancel"
            className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            onClick={handleClose}
            type="button"
          >
            Cancel
          </button>
          <button
            data-testid="fill-series-apply"
            className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            onClick={handleApply}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
