/**
 * FillSeriesDialog — Dialog for Fill Series configuration.
 * Allows users to generate linear, growth, or date series.
 */
import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import {
  fillSeries,
  type FillSeriesType,
  type FillSeriesDateUnit,
} from "../../utils/fillOperations";

export function FillSeriesDialog() {
  const isOpen = useUIStore((s) => s.isFillSeriesDialogOpen);
  const [seriesType, setSeriesType] = useState<FillSeriesType>("linear");
  const [stepValue, setStepValue] = useState("1");
  const [stopValue, setStopValue] = useState("");
  const [dateUnit, setDateUnit] = useState<FillSeriesDateUnit>("day");

  const handleClose = useCallback(() => {
    useUIStore.getState().setFillSeriesDialogOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    const step = Number(stepValue) || 1;
    const stop = stopValue ? Number(stopValue) : undefined;
    fillSeries({
      type: seriesType,
      stepValue: step,
      stopValue: stop,
      dateUnit: seriesType === "date" ? dateUnit : undefined,
    });
    handleClose();
  }, [seriesType, stepValue, stopValue, dateUnit, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="fill-series-dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={handleClose}
    >
      <div
        data-testid="fill-series-dialog"
        className="bg-white rounded-lg shadow-xl p-6 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Fill Series
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Series type
            </label>
            <select
              data-testid="fill-series-type"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={seriesType}
              onChange={(e) => setSeriesType(e.target.value as FillSeriesType)}
            >
              <option value="linear">Linear</option>
              <option value="growth">Growth</option>
              <option value="date">Date</option>
            </select>
          </div>

          {seriesType === "date" && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Date unit
              </label>
              <select
                data-testid="fill-series-date-unit"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={dateUnit}
                onChange={(e) =>
                  setDateUnit(e.target.value as FillSeriesDateUnit)
                }
              >
                <option value="day">Day</option>
                <option value="weekday">Weekday</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Step value
            </label>
            <input
              data-testid="fill-series-step"
              type="number"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={stepValue}
              onChange={(e) => setStepValue(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Stop value (optional)
            </label>
            <input
              data-testid="fill-series-stop"
              type="number"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={stopValue}
              onChange={(e) => setStopValue(e.target.value)}
              placeholder="No limit"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            data-testid="fill-series-cancel"
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            onClick={handleClose}
            type="button"
          >
            Cancel
          </button>
          <button
            data-testid="fill-series-apply"
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
