import { useEffect, useRef, useCallback } from "react";

interface TouchGridOptions {
  /** The scrollable container element */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Convert client coords to grid cell position */
  clientToCell: (
    clientX: number,
    clientY: number,
  ) => { row: number; col: number } | null;
  /** Called when a cell is tapped */
  onCellTap: (row: number, col: number) => void;
  /** Called when a cell is double-tapped */
  onCellDoubleTap: (row: number, col: number) => void;
  /** Called when long-press triggers context menu */
  onLongPress: (
    row: number,
    col: number,
    clientX: number,
    clientY: number,
  ) => void;
}

const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 300;
const MOVE_THRESHOLD = 10;

/**
 * Adds touch gesture support to the grid canvas:
 * - Single tap → select cell
 * - Double tap → start editing
 * - Long press → context menu
 * - Pinch is left to native browser zoom
 */
export function useTouchGrid({
  containerRef,
  clientToCell,
  onCellTap,
  onCellDoubleTap,
  onLongPress,
}: TouchGridOptions): void {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef(0);
  const lastTapCell = useRef<{ row: number; col: number } | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const didLongPress = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        clearLongPress();
        return;
      }

      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      didLongPress.current = false;

      const cell = clientToCell(touch.clientX, touch.clientY);
      if (!cell) return;

      longPressTimer.current = setTimeout(() => {
        didLongPress.current = true;
        onLongPress(cell.row, cell.col, touch.clientX, touch.clientY);
      }, LONG_PRESS_MS);
    }

    function handleTouchMove(e: TouchEvent) {
      if (!touchStartPos.current || e.touches.length !== 1) {
        clearLongPress();
        return;
      }
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
        clearLongPress();
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      clearLongPress();
      if (didLongPress.current) return;
      if (!touchStartPos.current) return;

      // Use the stored start position for cell detection
      const cell = clientToCell(
        touchStartPos.current.x,
        touchStartPos.current.y,
      );
      touchStartPos.current = null;
      if (!cell) return;

      const now = Date.now();
      const isDoubleTap =
        now - lastTapTime.current < DOUBLE_TAP_MS &&
        lastTapCell.current !== null &&
        lastTapCell.current.row === cell.row &&
        lastTapCell.current.col === cell.col;

      if (isDoubleTap) {
        e.preventDefault();
        onCellDoubleTap(cell.row, cell.col);
        lastTapTime.current = 0;
        lastTapCell.current = null;
      } else {
        onCellTap(cell.row, cell.col);
        lastTapTime.current = now;
        lastTapCell.current = cell;
      }
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      clearLongPress();
    };
  }, [
    containerRef,
    clientToCell,
    onCellTap,
    onCellDoubleTap,
    onLongPress,
    clearLongPress,
  ]);
}
