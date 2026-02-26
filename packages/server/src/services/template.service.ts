import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

interface TemplateSummary {
  id: string;
  title: string;
  templateName: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string | null; avatarUrl: string | null };
}

interface TemplateDetail {
  id: string;
  title: string;
  templateName: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string | null; avatarUrl: string | null };
  sheets: Array<{
    id: string;
    name: string;
    index: number;
    cellData: unknown;
    columnMeta: unknown;
    rowMeta: unknown;
  }>;
}

const SUMMARY_SELECT = {
  id: true,
  title: true,
  templateName: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, avatarUrl: true } },
};

const DETAIL_SELECT = {
  ...SUMMARY_SELECT,
  sheets: {
    orderBy: { index: "asc" as const },
    select: {
      id: true,
      name: true,
      index: true,
      cellData: true,
      columnMeta: true,
      rowMeta: true,
    },
  },
};

/** Built-in templates with pre-filled data */
const BUILT_IN_TEMPLATES: Array<{
  name: string;
  title: string;
  sheets: Array<{
    name: string;
    cellData: Record<string, unknown>;
  }>;
}> = [
  {
    name: "Budget",
    title: "Monthly Budget",
    sheets: [
      {
        name: "Budget",
        cellData: {
          A1: { value: "Category" },
          B1: { value: "Budgeted" },
          C1: { value: "Actual" },
          D1: { value: "Difference" },
          A2: { value: "Housing" },
          B2: { value: 1500 },
          C2: { value: 1500 },
          D2: { value: 0, formula: "=B2-C2" },
          A3: { value: "Food" },
          B3: { value: 500 },
          C3: { value: 450 },
          D3: { value: 50, formula: "=B3-C3" },
          A4: { value: "Transport" },
          B4: { value: 300 },
          C4: { value: 280 },
          D4: { value: 20, formula: "=B4-C4" },
          A5: { value: "Utilities" },
          B5: { value: 200 },
          C5: { value: 180 },
          D5: { value: 20, formula: "=B5-C5" },
          A6: { value: "Entertainment" },
          B6: { value: 200 },
          C6: { value: 250 },
          D6: { value: -50, formula: "=B6-C6" },
          A7: { value: "Total" },
          B7: { value: 2700, formula: "=SUM(B2:B6)" },
          C7: { value: 2660, formula: "=SUM(C2:C6)" },
          D7: { value: 40, formula: "=SUM(D2:D6)" },
        },
      },
    ],
  },
  {
    name: "Invoice",
    title: "Invoice Template",
    sheets: [
      {
        name: "Invoice",
        cellData: {
          A1: { value: "INVOICE" },
          A3: { value: "Bill To:" },
          A4: { value: "Client Name" },
          A5: { value: "Address" },
          D3: { value: "Invoice #:" },
          E3: { value: "INV-001" },
          D4: { value: "Date:" },
          E4: { value: "2026-01-01" },
          A7: { value: "Description" },
          B7: { value: "Qty" },
          C7: { value: "Rate" },
          D7: { value: "Amount" },
          A8: { value: "Service 1" },
          B8: { value: 10 },
          C8: { value: 50 },
          D8: { value: 500, formula: "=B8*C8" },
          A9: { value: "Service 2" },
          B9: { value: 5 },
          C9: { value: 75 },
          D9: { value: 375, formula: "=B9*C9" },
          C11: { value: "Subtotal:" },
          D11: { value: 875, formula: "=SUM(D8:D10)" },
          C12: { value: "Tax (10%):" },
          D12: { value: 87.5, formula: "=D11*0.1" },
          C13: { value: "Total:" },
          D13: { value: 962.5, formula: "=D11+D12" },
        },
      },
    ],
  },
  {
    name: "Project Tracker",
    title: "Project Tracker",
    sheets: [
      {
        name: "Tasks",
        cellData: {
          A1: { value: "Task" },
          B1: { value: "Assignee" },
          C1: { value: "Status" },
          D1: { value: "Priority" },
          E1: { value: "Due Date" },
          F1: { value: "Notes" },
          A2: { value: "Task 1" },
          C2: { value: "Not Started" },
          D2: { value: "High" },
          A3: { value: "Task 2" },
          C3: { value: "In Progress" },
          D3: { value: "Medium" },
          A4: { value: "Task 3" },
          C4: { value: "Complete" },
          D4: { value: "Low" },
        },
      },
    ],
  },
  {
    name: "Schedule",
    title: "Weekly Schedule",
    sheets: [
      {
        name: "Schedule",
        cellData: {
          A1: { value: "Time" },
          B1: { value: "Monday" },
          C1: { value: "Tuesday" },
          D1: { value: "Wednesday" },
          E1: { value: "Thursday" },
          F1: { value: "Friday" },
          A2: { value: "8:00 AM" },
          A3: { value: "9:00 AM" },
          A4: { value: "10:00 AM" },
          A5: { value: "11:00 AM" },
          A6: { value: "12:00 PM" },
          A7: { value: "1:00 PM" },
          A8: { value: "2:00 PM" },
          A9: { value: "3:00 PM" },
          A10: { value: "4:00 PM" },
          A11: { value: "5:00 PM" },
        },
      },
    ],
  },
  {
    name: "Gradebook",
    title: "Gradebook",
    sheets: [
      {
        name: "Grades",
        cellData: {
          A1: { value: "Student" },
          B1: { value: "Assignment 1" },
          C1: { value: "Assignment 2" },
          D1: { value: "Midterm" },
          E1: { value: "Final" },
          F1: { value: "Average" },
          A2: { value: "Student 1" },
          F2: { value: 0, formula: "=AVERAGE(B2:E2)" },
          A3: { value: "Student 2" },
          F3: { value: 0, formula: "=AVERAGE(B3:E3)" },
          A4: { value: "Student 3" },
          F4: { value: 0, formula: "=AVERAGE(B4:E4)" },
          A5: { value: "Class Average" },
          B5: { value: 0, formula: "=AVERAGE(B2:B4)" },
          C5: { value: 0, formula: "=AVERAGE(C2:C4)" },
          D5: { value: 0, formula: "=AVERAGE(D2:D4)" },
          E5: { value: 0, formula: "=AVERAGE(E2:E4)" },
          F5: { value: 0, formula: "=AVERAGE(F2:F4)" },
        },
      },
    ],
  },
];

/** List all available templates (built-in + user-created) */
export async function listTemplates(
  _userId: string,
): Promise<TemplateSummary[]> {
  const userTemplates = await prisma.spreadsheet.findMany({
    where: { isTemplate: true },
    select: SUMMARY_SELECT,
    orderBy: { createdAt: "desc" },
  });

  // Add built-in templates as virtual entries
  const builtIn: TemplateSummary[] = BUILT_IN_TEMPLATES.map((t) => ({
    id: `builtin-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
    title: t.title,
    templateName: t.name,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    owner: { id: "system", name: "GridSpace", avatarUrl: null },
  }));

  return [...builtIn, ...userTemplates];
}

/** Create a spreadsheet from a template */
export async function createFromTemplate(
  userId: string,
  templateId: string,
): Promise<TemplateDetail> {
  // Check if it's a built-in template
  if (templateId.startsWith("builtin-")) {
    const slug = templateId.replace("builtin-", "");
    const template = BUILT_IN_TEMPLATES.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, "-") === slug,
    );

    if (!template) throw new NotFoundError("Template not found");

    const spreadsheet = await prisma.spreadsheet.create({
      data: {
        title: template.title,
        ownerId: userId,
        sheets: {
          create: template.sheets.map((s, idx) => ({
            name: s.name,
            index: idx,
            cellData: s.cellData,
            columnMeta: {},
            rowMeta: {},
          })),
        },
        access: {
          create: { userId, role: "owner" },
        },
      },
      select: DETAIL_SELECT,
    });

    logger.info(
      { userId, templateId, spreadsheetId: spreadsheet.id },
      "Spreadsheet created from built-in template",
    );

    return spreadsheet;
  }

  // User-created template
  const template = await prisma.spreadsheet.findUnique({
    where: { id: templateId },
    select: {
      isTemplate: true,
      title: true,
      sheets: {
        orderBy: { index: "asc" },
        select: {
          name: true,
          index: true,
          cellData: true,
          columnMeta: true,
          rowMeta: true,
        },
      },
    },
  });

  if (!template || !template.isTemplate) {
    throw new NotFoundError("Template not found");
  }

  const spreadsheet = await prisma.spreadsheet.create({
    data: {
      title: template.title,
      ownerId: userId,
      sheets: {
        create: template.sheets.map((s) => ({
          name: s.name,
          index: s.index,
          cellData: s.cellData as object,
          columnMeta: s.columnMeta as object,
          rowMeta: s.rowMeta as object,
        })),
      },
      access: {
        create: { userId, role: "owner" },
      },
    },
    select: DETAIL_SELECT,
  });

  logger.info(
    { userId, templateId, spreadsheetId: spreadsheet.id },
    "Spreadsheet created from user template",
  );

  return spreadsheet;
}

/** Save an existing spreadsheet as a template */
export async function saveAsTemplate(
  spreadsheetId: string,
  userId: string,
  templateName: string,
): Promise<TemplateSummary> {
  // Verify ownership
  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: { ownerId: true },
  });

  if (!ss) throw new NotFoundError("Spreadsheet not found");
  if (ss.ownerId !== userId) {
    throw new ForbiddenError("Only the owner can save as template");
  }

  const updated = await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { isTemplate: true, templateName },
    select: SUMMARY_SELECT,
  });

  logger.info(
    { userId, spreadsheetId, templateName },
    "Spreadsheet saved as template",
  );

  return updated;
}
