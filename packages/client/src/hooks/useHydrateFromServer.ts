import { useEffect, useRef } from "react";
import { useCellStore } from "../stores/cellStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";
import { useCloudStore } from "../stores/cloudStore";
import type { CellData } from "../types/grid";

/**
 * Hydrates local Zustand stores from server data when a spreadsheet is loaded.
 * Populates cellStore, spreadsheetStore sheets/tabs from the cloud response.
 */
export function useHydrateFromServer(): void {
  const currentSpreadsheet = useCloudStore((s) => s.currentSpreadsheet);
  const hydratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentSpreadsheet) return;

    // Only hydrate once per spreadsheet load
    if (hydratedRef.current === currentSpreadsheet.id) return;
    hydratedRef.current = currentSpreadsheet.id;

    // Hydrate spreadsheetStore with sheet tabs
    const spreadsheetStore = useSpreadsheetStore.getState();
    const cellStore = useCellStore.getState();

    // Update spreadsheet metadata
    useSpreadsheetStore.setState({
      id: currentSpreadsheet.id,
      title: currentSpreadsheet.title,
    });

    // Build sheet list from server data
    const serverSheets = currentSpreadsheet.sheets;
    if (serverSheets.length > 0) {
      const localSheets = serverSheets.map((s) => ({
        id: s.id,
        name: s.name,
        cells: new Map(),
        columnWidths: new Map(),
        rowHeights: new Map(),
        frozenRows: s.frozenRows,
        frozenCols: s.frozenCols,
        hiddenRows: new Set<number>(),
        hiddenCols: new Set<number>(),
        tabColor: s.color ?? undefined,
      }));

      useSpreadsheetStore.setState({
        sheets: localSheets,
        activeSheetId: localSheets[0].id,
      });

      // Hydrate cellStore with cell data from each sheet
      for (const serverSheet of serverSheets) {
        const cellData = serverSheet.cellData as Record<
          string,
          CellData
        > | null;
        if (!cellData || typeof cellData !== "object") continue;

        cellStore.ensureSheet(serverSheet.id);
        const sheetCells = new Map<string, CellData>();

        for (const [key, value] of Object.entries(cellData)) {
          if (value && typeof value === "object") {
            sheetCells.set(key, value as CellData);
          }
        }

        // Set cells directly via setState to avoid per-cell overhead
        useCellStore.setState((state) => {
          const newCells = new Map(state.cells);
          newCells.set(serverSheet.id, sheetCells);
          return { cells: newCells };
        });
      }
    }
  }, [currentSpreadsheet]);
}
