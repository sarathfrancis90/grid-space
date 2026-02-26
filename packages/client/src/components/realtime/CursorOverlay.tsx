import React, { useEffect, useRef, useCallback } from "react";
import { useRealtimeStore } from "../../stores/realtimeStore";
import type { CursorPosition } from "../../stores/realtimeStore";

interface CursorOverlayProps {
  /** Active sheet ID to filter cursors */
  sheetId: string;
  /** Map cell ref (e.g. "A1") → pixel position { x, y, width, height } */
  getCellRect: (
    cellRef: string,
  ) => { x: number; y: number; width: number; height: number } | null;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

/**
 * Renders colored cursors and selection ranges for collaborators
 * on a transparent Canvas overlay layer.
 */
export const CursorOverlay = React.memo(function CursorOverlay({
  sheetId,
  getCellRect,
  width,
  height,
}: CursorOverlayProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursors = useRealtimeStore((state) => state.activeCursors);
  const typingCells = useRealtimeStore((state) => state.typingCells);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Filter cursors for current sheet
    const sheetCursors = cursors.filter((c) => c.sheetId === sheetId);

    for (const cursor of sheetCursors) {
      drawCursor(ctx, cursor, getCellRect);
    }

    // Draw typing indicators (pulsing border)
    const sheetTyping = typingCells.filter((t) => t.sheetId === sheetId);
    for (const typing of sheetTyping) {
      drawTypingIndicator(ctx, typing.cell, getCellRect);
    }
  }, [cursors, typingCells, sheetId, getCellRect, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="cursor-overlay"
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width, height }}
    />
  );
});

function drawCursor(
  ctx: CanvasRenderingContext2D,
  cursor: CursorPosition,
  getCellRect: (
    ref: string,
  ) => { x: number; y: number; width: number; height: number } | null,
): void {
  const rect = getCellRect(cursor.cell);
  if (!rect) return;

  // Draw cell highlight
  ctx.strokeStyle = cursor.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    Math.floor(rect.x) + 0.5,
    Math.floor(rect.y) + 0.5,
    Math.floor(rect.width) - 1,
    Math.floor(rect.height) - 1,
  );

  // Draw selection range if present
  if (cursor.range) {
    const parts = cursor.range.split(":");
    if (parts.length === 2) {
      const startRect = getCellRect(parts[0]);
      const endRect = getCellRect(parts[1]);
      if (startRect && endRect) {
        const x = Math.min(startRect.x, endRect.x);
        const y = Math.min(startRect.y, endRect.y);
        const w =
          Math.max(startRect.x + startRect.width, endRect.x + endRect.width) -
          x;
        const h =
          Math.max(startRect.y + startRect.height, endRect.y + endRect.height) -
          y;

        ctx.fillStyle = cursor.color + "20"; // 12% opacity
        ctx.fillRect(
          Math.floor(x),
          Math.floor(y),
          Math.floor(w),
          Math.floor(h),
        );
        ctx.strokeStyle = cursor.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          Math.floor(x) + 0.5,
          Math.floor(y) + 0.5,
          Math.floor(w) - 1,
          Math.floor(h) - 1,
        );
      }
    }
  }

  // Draw name label
  const labelText = cursor.name;
  ctx.font = "11px Inter, system-ui, sans-serif";
  const textWidth = ctx.measureText(labelText).width;
  const labelX = Math.floor(rect.x);
  const labelY = Math.floor(rect.y) - 16;
  const padding = 4;

  ctx.fillStyle = cursor.color;
  ctx.beginPath();
  ctx.roundRect(labelX, Math.max(0, labelY), textWidth + padding * 2, 14, 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(labelText, labelX + padding, Math.max(10, labelY + 11));
}

function drawTypingIndicator(
  ctx: CanvasRenderingContext2D,
  cellRef: string,
  getCellRect: (
    ref: string,
  ) => { x: number; y: number; width: number; height: number } | null,
): void {
  const rect = getCellRect(cellRef);
  if (!rect) return;

  // Dashed border for typing
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#9333ea";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    Math.floor(rect.x) + 0.5,
    Math.floor(rect.y) + 0.5,
    Math.floor(rect.width) - 1,
    Math.floor(rect.height) - 1,
  );
  ctx.setLineDash([]);
}

export default CursorOverlay;
