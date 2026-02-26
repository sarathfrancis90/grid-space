import React from "react";
import { useUIStore } from "../../stores/uiStore";

const ZOOM_PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

export const ZoomControls: React.FC = () => {
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);

  return (
    <div className="flex items-center gap-0.5 px-2" data-testid="zoom-controls">
      <button
        className="flex h-5 w-5 items-center justify-center rounded-sm text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-40"
        data-testid="zoom-out"
        disabled={zoom <= 50}
        onClick={() => setZoom(zoom - 10)}
        aria-label="Zoom out"
      >
        −
      </button>

      <select
        className="h-5 w-14 rounded-sm border-none bg-transparent px-0.5 text-center text-xs text-gray-500"
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        data-testid="zoom-select"
      >
        {ZOOM_PRESETS.map((z) => (
          <option key={z} value={z}>
            {z}%
          </option>
        ))}
        {!ZOOM_PRESETS.includes(zoom) && <option value={zoom}>{zoom}%</option>}
      </select>

      <button
        className="flex h-5 w-5 items-center justify-center rounded-sm text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-40"
        data-testid="zoom-in"
        disabled={zoom >= 200}
        onClick={() => setZoom(zoom + 10)}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
};
