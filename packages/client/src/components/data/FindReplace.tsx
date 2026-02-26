import { useCallback, useEffect, useRef } from "react";
import { useFindReplaceStore } from "../../stores/findReplaceStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useGridStore } from "../../stores/gridStore";
import { useUIStore } from "../../stores/uiStore";

export function FindReplace() {
  const isOpen = useFindReplaceStore((s) => s.isOpen);
  const showReplace = useFindReplaceStore((s) => s.showReplace);
  const searchTerm = useFindReplaceStore((s) => s.searchTerm);
  const replaceTerm = useFindReplaceStore((s) => s.replaceTerm);
  const useRegex = useFindReplaceStore((s) => s.useRegex);
  const caseSensitive = useFindReplaceStore((s) => s.caseSensitive);
  const matchEntireCell = useFindReplaceStore((s) => s.matchEntireCell);
  const matches = useFindReplaceStore((s) => s.matches);
  const currentMatchIndex = useFindReplaceStore((s) => s.currentMatchIndex);

  const setSearchTerm = useFindReplaceStore((s) => s.setSearchTerm);
  const setReplaceTerm = useFindReplaceStore((s) => s.setReplaceTerm);
  const setUseRegex = useFindReplaceStore((s) => s.setUseRegex);
  const setCaseSensitive = useFindReplaceStore((s) => s.setCaseSensitive);
  const setMatchEntireCell = useFindReplaceStore((s) => s.setMatchEntireCell);
  const findAll = useFindReplaceStore((s) => s.findAll);
  const findNext = useFindReplaceStore((s) => s.findNext);
  const findPrev = useFindReplaceStore((s) => s.findPrev);
  const replaceCurrent = useFindReplaceStore((s) => s.replaceCurrent);
  const replaceAll = useFindReplaceStore((s) => s.replaceAll);
  const close = useFindReplaceStore((s) => s.close);
  const open = useFindReplaceStore((s) => s.open);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
      searchRef.current.select();
    }
  }, [isOpen, showReplace]);

  const doFind = useCallback(() => {
    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
    const sheetCells = useCellStore.getState().cells.get(activeSheetId);
    if (!sheetCells) return;
    const gs = useGridStore.getState();
    findAll(activeSheetId, sheetCells, gs.totalRows, gs.totalCols);
  }, [findAll]);

  const goToMatch = useCallback((pos: { row: number; col: number } | null) => {
    if (!pos) return;
    useUIStore.getState().setSelectedCell(pos);
  }, []);

  const handleFindNext = useCallback(() => {
    if (matches.length === 0) {
      doFind();
      return;
    }
    const pos = findNext();
    goToMatch(pos);
  }, [matches.length, doFind, findNext, goToMatch]);

  const handleFindPrev = useCallback(() => {
    if (matches.length === 0) {
      doFind();
      return;
    }
    const pos = findPrev();
    goToMatch(pos);
  }, [matches.length, doFind, findPrev, goToMatch]);

  const handleReplaceCurrent = useCallback(() => {
    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
    const cs = useCellStore.getState();
    replaceCurrent(activeSheetId, cs.setCell, cs.getCell);
    doFind();
  }, [replaceCurrent, doFind]);

  const handleReplaceAll = useCallback(() => {
    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;
    const cs = useCellStore.getState();
    replaceAll(activeSheetId, cs.setCell, cs.getCell);
  }, [replaceAll]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleFindPrev();
        } else {
          handleFindNext();
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [handleFindNext, handleFindPrev, close],
  );

  useEffect(() => {
    doFind();
  }, [searchTerm, useRegex, caseSensitive, matchEntireCell, doFind]);

  if (!isOpen) return null;

  const matchInfo =
    matches.length > 0
      ? `${currentMatchIndex + 1} of ${matches.length}`
      : searchTerm
        ? "No matches"
        : "";

  return (
    <div
      data-testid="find-replace-dialog"
      style={{
        position: "absolute",
        top: 8,
        right: 16,
        zIndex: 100,
        background: "white",
        border: "1px solid #dadce0",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: "12px 16px",
        minWidth: 320,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          ref={searchRef}
          data-testid="find-input"
          type="text"
          placeholder="Find"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{
            flex: 1,
            padding: "6px 8px",
            border: "1px solid #dadce0",
            borderRadius: 4,
            fontSize: 13,
            outline: "none",
          }}
        />
        <span
          data-testid="find-match-info"
          style={{ fontSize: 12, color: "#666", minWidth: 60 }}
        >
          {matchInfo}
        </span>
        <button
          data-testid="find-prev-btn"
          onClick={handleFindPrev}
          title="Previous (Shift+Enter)"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 16,
            padding: "2px 6px",
          }}
        >
          &#9650;
        </button>
        <button
          data-testid="find-next-btn"
          onClick={handleFindNext}
          title="Next (Enter)"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 16,
            padding: "2px 6px",
          }}
        >
          &#9660;
        </button>
        <button
          data-testid="find-close-btn"
          onClick={close}
          title="Close (Escape)"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 16,
            padding: "2px 6px",
          }}
        >
          &#10005;
        </button>
      </div>

      {showReplace && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <input
            data-testid="replace-input"
            type="text"
            placeholder="Replace with"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            style={{
              flex: 1,
              padding: "6px 8px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            data-testid="replace-btn"
            onClick={handleReplaceCurrent}
            style={{
              padding: "4px 10px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              background: "white",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Replace
          </button>
          <button
            data-testid="replace-all-btn"
            onClick={handleReplaceAll}
            style={{
              padding: "4px 10px",
              border: "1px solid #dadce0",
              borderRadius: 4,
              background: "white",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            All
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 8,
          fontSize: 12,
          color: "#444",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            data-testid="find-regex-toggle"
            type="checkbox"
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
          />
          Regex
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            data-testid="find-case-toggle"
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Match case
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            data-testid="find-entire-cell-toggle"
            type="checkbox"
            checked={matchEntireCell}
            onChange={(e) => setMatchEntireCell(e.target.checked)}
          />
          Entire cell
        </label>
        {!showReplace && (
          <button
            data-testid="show-replace-btn"
            onClick={() => open(true)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "#1a73e8",
              padding: 0,
            }}
          >
            Replace
          </button>
        )}
      </div>
    </div>
  );
}
