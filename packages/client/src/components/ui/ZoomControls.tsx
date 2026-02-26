import React from "react";
import { useUIStore } from "../../stores/uiStore";

const ZOOM_PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

export const ZoomControls: React.FC = () => {
  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);

  return (
    <div className="flex items-center gap-1" data-testid="zoom-controls">
      <button
        className="px-1 py-0.5 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
        data-testid="zoom-out"
        disabled={zoom <= 50}
        onClick={() => setZoom(zoom - 10)}
        aria-label="Zoom out"
      >
        -
      </button>

      <select
        className="text-xs border rounded px-1 py-0.5 w-16 text-center"
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
        className="px-1 py-0.5 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
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
