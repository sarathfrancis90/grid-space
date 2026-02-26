import type { CellPosition } from "../types/grid";

export function colToLetter(col: number): string {
  let result = "";
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function letterToCol(letter: string): number {
  let col = 0;
  const upper = letter.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function cellRefToPosition(ref: string): CellPosition {
  const match = ref.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`);
  }
  const col = letterToCol(match[1]);
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
}

export function positionToCellRef(pos: CellPosition): string {
  return `${colToLetter(pos.col)}${pos.row + 1}`;
}

export function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}
