/**
 * Public API controllers — handles /api/v1/ endpoints.
 * Uses API key auth, standard envelope responses.
 */
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index";
import { apiSuccess } from "../utils/apiResponse";
import { AppError, NotFoundError } from "../utils/AppError";
import type { Prisma } from "@prisma/client";
import prisma from "../models/prisma";
import * as spreadsheetService from "../services/spreadsheet.service";
import * as webhookService from "../services/webhook.service";

function paramStr(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0];
  return val ?? "";
}

/** GET /api/v1/spreadsheets/:id — read spreadsheet */
export async function getSpreadsheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const data = await spreadsheetService.getSpreadsheet(id, req.user.id);
    res.json(apiSuccess(data));
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/spreadsheets/:id/sheets — list sheets */
export async function listSheets(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);

    // Verify access
    await spreadsheetService.getSpreadsheet(id, req.user.id);

    const sheets = await prisma.sheet.findMany({
      where: { spreadsheetId: id },
      select: {
        id: true,
        name: true,
        index: true,
        color: true,
        isHidden: true,
      },
      orderBy: { index: "asc" },
    });

    res.json(apiSuccess(sheets));
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/spreadsheets/:id/sheets/:sheetId/cells — read cells */
export async function getCells(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const sheetId = paramStr(req.params.sheetId);

    // Verify access
    await spreadsheetService.getSpreadsheet(id, req.user.id);

    const sheet = await prisma.sheet.findFirst({
      where: { id: sheetId, spreadsheetId: id },
      select: { cellData: true },
    });

    if (!sheet) throw new NotFoundError("Sheet not found");

    const range = req.query.range as string | undefined;
    const cells = sheet.cellData as Record<string, unknown>;

    if (range) {
      const filtered = filterCellsByRange(cells, range);
      res.json(apiSuccess({ sheetId, cells: filtered }));
    } else {
      res.json(apiSuccess({ sheetId, cells }));
    }
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/spreadsheets/:id/sheets/:sheetId/cells — write cells */
export async function updateCells(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const sheetId = paramStr(req.params.sheetId);
    const updates: Array<{ cell: string; value: unknown }> = req.body.cells;

    // Verify editor access
    await checkEditorAccess(id, req.user.id);

    const sheet = await prisma.sheet.findFirst({
      where: { id: sheetId, spreadsheetId: id },
      select: { cellData: true },
    });

    if (!sheet) throw new NotFoundError("Sheet not found");

    const cellData = (sheet.cellData ?? {}) as Record<string, unknown>;

    for (const update of updates) {
      const cellKey = update.cell.toUpperCase();
      const existing = (cellData[cellKey] ?? {}) as Record<string, unknown>;
      cellData[cellKey] = { ...existing, value: update.value };
    }

    await prisma.sheet.update({
      where: { id: sheetId },
      data: { cellData: cellData as Prisma.InputJsonValue },
    });

    // Touch spreadsheet updatedAt
    await prisma.spreadsheet.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Dispatch webhooks (fire-and-forget)
    webhookService
      .dispatchWebhooks(id, "cell.updated", {
        spreadsheetId: id,
        sheetId,
        changes: updates,
        userId: req.user.id,
      })
      .catch(() => {
        /* non-blocking */
      });

    res.json(apiSuccess({ sheetId, updatedCells: updates.length }));
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/spreadsheets/:id/export/:format — export */
export async function exportSpreadsheet(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const id = paramStr(req.params.id);
    const format = paramStr(req.params.format);

    if (!["csv", "xlsx", "pdf"].includes(format)) {
      throw new AppError(400, "Unsupported format. Use csv, xlsx, or pdf");
    }

    // Verify access
    const spreadsheet = await spreadsheetService.getSpreadsheet(
      id,
      req.user.id,
    );

    if (format === "csv") {
      const csv = spreadsheetToCSV(spreadsheet);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${spreadsheet.title}.csv"`,
      );
      res.send(csv);
    } else if (format === "xlsx") {
      res.json(
        apiSuccess({
          title: spreadsheet.title,
          sheets: spreadsheet.sheets,
          format: "xlsx",
        }),
      );
    } else {
      res.json(
        apiSuccess({
          title: spreadsheet.title,
          sheets: spreadsheet.sheets,
          format: "pdf",
        }),
      );
    }
  } catch (err) {
    next(err);
  }
}

// --- Helpers ---

async function checkEditorAccess(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!spreadsheet) throw new NotFoundError("Spreadsheet not found");
  if (spreadsheet.ownerId === userId) return;

  const access = spreadsheet.access[0];
  if (!access || (access.role !== "editor" && access.role !== "owner")) {
    throw new AppError(403, "You need editor access to write cells");
  }
}

function filterCellsByRange(
  cells: Record<string, unknown>,
  range: string,
): Record<string, unknown> {
  const parts = range.toUpperCase().split(":");
  if (parts.length === 1) {
    const key = parts[0];
    return key in cells ? { [key]: cells[key] } : {};
  }

  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return cells;

  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(cells)) {
    const ref = parseCellRef(key);
    if (
      ref &&
      ref.col >= start.col &&
      ref.col <= end.col &&
      ref.row >= start.row &&
      ref.row <= end.row
    ) {
      filtered[key] = cells[key];
    }
  }
  return filtered;
}

function parseCellRef(ref: string): { col: number; row: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = colLetterToIndex(match[1]);
  const row = parseInt(match[2], 10);
  return { col, row };
}

function colLetterToIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index;
}

interface SheetData {
  cellData: unknown;
  name: string;
}

interface SpreadsheetData {
  title: string;
  sheets: SheetData[];
}

function spreadsheetToCSV(spreadsheet: SpreadsheetData): string {
  const firstSheet = spreadsheet.sheets[0];
  if (!firstSheet) return "";

  const cells = (firstSheet.cellData ?? {}) as Record<
    string,
    { value?: unknown }
  >;
  if (Object.keys(cells).length === 0) return "";

  let maxRow = 0;
  let maxCol = 0;
  for (const key of Object.keys(cells)) {
    const ref = parseCellRef(key.toUpperCase());
    if (ref) {
      if (ref.row > maxRow) maxRow = ref.row;
      if (ref.col > maxCol) maxCol = ref.col;
    }
  }

  const rows: string[] = [];
  for (let r = 1; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 1; c <= maxCol; c++) {
      const key = colIndexToLetter(c) + r;
      const cell = cells[key];
      const val = cell?.value ?? "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        row.push(`"${str.replace(/"/g, '""')}"`);
      } else {
        row.push(str);
      }
    }
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

function colIndexToLetter(index: number): string {
  let result = "";
  let n = index;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}
