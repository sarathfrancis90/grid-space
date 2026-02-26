import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CellData, CellPosition } from "../types/grid";
import { getCellKey } from "../utils/coordinates";

interface FindReplaceState {
  isOpen: boolean;
  showReplace: boolean;
  searchTerm: string;
  replaceTerm: string;
  useRegex: boolean;
  caseSensitive: boolean;
  matchEntireCell: boolean;
  matches: CellPosition[];
  currentMatchIndex: number;

  open: (showReplace?: boolean) => void;
  close: () => void;
  setSearchTerm: (term: string) => void;
  setReplaceTerm: (term: string) => void;
  setUseRegex: (val: boolean) => void;
  setCaseSensitive: (val: boolean) => void;
  setMatchEntireCell: (val: boolean) => void;

  findAll: (
    sheetId: string,
    cells: Map<string, CellData>,
    totalRows: number,
    totalCols: number,
  ) => void;
  findNext: () => CellPosition | null;
  findPrev: () => CellPosition | null;
  replaceCurrent: (
    sheetId: string,
    setCellFn: (
      sheetId: string,
      row: number,
      col: number,
      data: CellData,
    ) => void,
    getCellFn: (
      sheetId: string,
      row: number,
      col: number,
    ) => CellData | undefined,
  ) => void;
  replaceAll: (
    sheetId: string,
    setCellFn: (
      sheetId: string,
      row: number,
      col: number,
      data: CellData,
    ) => void,
    getCellFn: (
      sheetId: string,
      row: number,
      col: number,
    ) => CellData | undefined,
  ) => number;
}

function buildMatcher(
  searchTerm: string,
  useRegex: boolean,
  caseSensitive: boolean,
  matchEntireCell: boolean,
): (value: string) => boolean {
  if (!searchTerm) return () => false;

  if (useRegex) {
    try {
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(searchTerm, flags);
      if (matchEntireCell) {
        const fullMatchRegex = new RegExp(`^${searchTerm}$`, flags);
        return (value: string) => fullMatchRegex.test(value);
      }
      return (value: string) => regex.test(value);
    } catch {
      return () => false;
    }
  }

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  return (value: string) => {
    const v = caseSensitive ? value : value.toLowerCase();
    return matchEntireCell ? v === term : v.includes(term);
  };
}

function doReplace(
  cellValue: string,
  searchTerm: string,
  replaceTerm: string,
  useRegex: boolean,
  caseSensitive: boolean,
): string {
  if (useRegex) {
    try {
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(searchTerm, flags);
      return cellValue.replace(regex, replaceTerm);
    } catch {
      return cellValue;
    }
  }

  if (!caseSensitive) {
    const lowerVal = cellValue.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    let result = "";
    let idx = 0;
    while (idx < cellValue.length) {
      const pos = lowerVal.indexOf(lowerTerm, idx);
      if (pos === -1) {
        result += cellValue.slice(idx);
        break;
      }
      result += cellValue.slice(idx, pos) + replaceTerm;
      idx = pos + searchTerm.length;
    }
    return result;
  }

  return cellValue.split(searchTerm).join(replaceTerm);
}

export const useFindReplaceStore = create<FindReplaceState>()(
  immer((set, get) => ({
    isOpen: false,
    showReplace: false,
    searchTerm: "",
    replaceTerm: "",
    useRegex: false,
    caseSensitive: false,
    matchEntireCell: false,
    matches: [],
    currentMatchIndex: -1,

    open: (showReplace = false) => {
      set((state) => {
        state.isOpen = true;
        state.showReplace = showReplace;
      });
    },

    close: () => {
      set((state) => {
        state.isOpen = false;
        state.matches = [];
        state.currentMatchIndex = -1;
      });
    },

    setSearchTerm: (term: string) => {
      set((state) => {
        state.searchTerm = term;
        state.matches = [];
        state.currentMatchIndex = -1;
      });
    },

    setReplaceTerm: (term: string) => {
      set((state) => {
        state.replaceTerm = term;
      });
    },

    setUseRegex: (val: boolean) => {
      set((state) => {
        state.useRegex = val;
        state.matches = [];
        state.currentMatchIndex = -1;
      });
    },

    setCaseSensitive: (val: boolean) => {
      set((state) => {
        state.caseSensitive = val;
        state.matches = [];
        state.currentMatchIndex = -1;
      });
    },

    setMatchEntireCell: (val: boolean) => {
      set((state) => {
        state.matchEntireCell = val;
        state.matches = [];
        state.currentMatchIndex = -1;
      });
    },

    findAll: (
      sheetId: string,
      cells: Map<string, CellData>,
      totalRows: number,
      totalCols: number,
    ) => {
      const state = get();
      const matcher = buildMatcher(
        state.searchTerm,
        state.useRegex,
        state.caseSensitive,
        state.matchEntireCell,
      );

      const found: CellPosition[] = [];
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          const cell = cells.get(getCellKey(r, c));
          if (cell?.value != null) {
            const strVal = String(cell.value);
            if (matcher(strVal)) {
              found.push({ row: r, col: c });
            }
          }
        }
      }

      set((s) => {
        s.matches = found;
        s.currentMatchIndex = found.length > 0 ? 0 : -1;
      });

      void sheetId;
    },

    findNext: () => {
      const state = get();
      if (state.matches.length === 0) return null;
      const nextIdx = (state.currentMatchIndex + 1) % state.matches.length;
      set((s) => {
        s.currentMatchIndex = nextIdx;
      });
      return state.matches[nextIdx];
    },

    findPrev: () => {
      const state = get();
      if (state.matches.length === 0) return null;
      const prevIdx =
        (state.currentMatchIndex - 1 + state.matches.length) %
        state.matches.length;
      set((s) => {
        s.currentMatchIndex = prevIdx;
      });
      return state.matches[prevIdx];
    },

    replaceCurrent: (sheetId, setCellFn, getCellFn) => {
      const state = get();
      if (state.currentMatchIndex < 0 || state.matches.length === 0) return;
      const match = state.matches[state.currentMatchIndex];
      const cell = getCellFn(sheetId, match.row, match.col);
      if (!cell || cell.value == null) return;

      const strVal = String(cell.value);
      const newValue = doReplace(
        strVal,
        state.searchTerm,
        state.replaceTerm,
        state.useRegex,
        state.caseSensitive,
      );

      setCellFn(sheetId, match.row, match.col, {
        ...cell,
        value: newValue,
      });
    },

    replaceAll: (sheetId, setCellFn, getCellFn) => {
      const state = get();
      let count = 0;
      for (const match of state.matches) {
        const cell = getCellFn(sheetId, match.row, match.col);
        if (!cell || cell.value == null) continue;

        const strVal = String(cell.value);
        const newValue = doReplace(
          strVal,
          state.searchTerm,
          state.replaceTerm,
          state.useRegex,
          state.caseSensitive,
        );

        if (newValue !== strVal) {
          setCellFn(sheetId, match.row, match.col, {
            ...cell,
            value: newValue,
          });
          count++;
        }
      }

      set((s) => {
        s.matches = [];
        s.currentMatchIndex = -1;
      });

      return count;
    },
  })),
);
