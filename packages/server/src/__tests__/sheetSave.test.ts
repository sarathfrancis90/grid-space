import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveCellData } from "../services/sheet.service";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    spreadsheet: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sheet: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

// Mock logger
vi.mock("../utils/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import prisma from "../models/prisma";

const mockPrisma = prisma as unknown as {
  spreadsheet: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  sheet: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("Sheet Save Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves cell data for a sheet owned by the user", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });

    mockPrisma.sheet.findFirst.mockResolvedValue({ id: "sheet-1" });

    const updatedAt = new Date("2026-01-15T12:00:00Z");
    mockPrisma.sheet.update.mockResolvedValue({ updatedAt });
    mockPrisma.spreadsheet.update.mockResolvedValue({});

    const result = await saveCellData("ss-1", "sheet-1", "user-1", {
      A1: { value: "Hello" },
      B2: { value: 42 },
    });

    expect(result.updatedAt).toEqual(updatedAt);
    expect(mockPrisma.sheet.update).toHaveBeenCalledWith({
      where: { id: "sheet-1" },
      data: { cellData: { A1: { value: "Hello" }, B2: { value: 42 } } },
      select: { updatedAt: true },
    });
    expect(mockPrisma.spreadsheet.update).toHaveBeenCalledWith({
      where: { id: "ss-1" },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it("saves cell data with columnMeta and rowMeta", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });
    mockPrisma.sheet.findFirst.mockResolvedValue({ id: "sheet-1" });
    mockPrisma.sheet.update.mockResolvedValue({
      updatedAt: new Date("2026-01-15T12:00:00Z"),
    });
    mockPrisma.spreadsheet.update.mockResolvedValue({});

    await saveCellData(
      "ss-1",
      "sheet-1",
      "user-1",
      { A1: { value: "test" } },
      { "0": { width: 150 } },
      { "0": { height: 30 } },
    );

    expect(mockPrisma.sheet.update).toHaveBeenCalledWith({
      where: { id: "sheet-1" },
      data: {
        cellData: { A1: { value: "test" } },
        columnMeta: { "0": { width: 150 } },
        rowMeta: { "0": { height: 30 } },
      },
      select: { updatedAt: true },
    });
  });

  it("saves cell data for a user with editor access", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "other-user",
      access: [{ role: "editor" }],
    });
    mockPrisma.sheet.findFirst.mockResolvedValue({ id: "sheet-1" });
    mockPrisma.sheet.update.mockResolvedValue({
      updatedAt: new Date("2026-01-15T12:00:00Z"),
    });
    mockPrisma.spreadsheet.update.mockResolvedValue({});

    const result = await saveCellData("ss-1", "sheet-1", "editor-user", {
      A1: { value: "from editor" },
    });

    expect(result.updatedAt).toBeDefined();
  });

  it("throws ForbiddenError for viewer access", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "other-user",
      access: [{ role: "viewer" }],
    });

    await expect(
      saveCellData("ss-1", "sheet-1", "viewer-user", { A1: { value: "x" } }),
    ).rejects.toThrow("You need editor access to modify sheets");
  });

  it("throws ForbiddenError for no access", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "other-user",
      access: [],
    });

    await expect(
      saveCellData("ss-1", "sheet-1", "stranger", { A1: { value: "x" } }),
    ).rejects.toThrow("You need editor access to modify sheets");
  });

  it("throws NotFoundError for non-existent spreadsheet", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue(null);

    await expect(
      saveCellData("nonexistent", "sheet-1", "user-1", {}),
    ).rejects.toThrow("Spreadsheet not found");
  });

  it("throws NotFoundError for non-existent sheet", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });
    mockPrisma.sheet.findFirst.mockResolvedValue(null);

    await expect(
      saveCellData("ss-1", "nonexistent", "user-1", {}),
    ).rejects.toThrow("Sheet not found");
  });

  it("touches spreadsheet updatedAt after saving", async () => {
    mockPrisma.spreadsheet.findUnique.mockResolvedValue({
      ownerId: "user-1",
      access: [],
    });
    mockPrisma.sheet.findFirst.mockResolvedValue({ id: "sheet-1" });
    mockPrisma.sheet.update.mockResolvedValue({
      updatedAt: new Date("2026-01-15T12:00:00Z"),
    });
    mockPrisma.spreadsheet.update.mockResolvedValue({});

    await saveCellData("ss-1", "sheet-1", "user-1", { A1: { value: "x" } });

    expect(mockPrisma.spreadsheet.update).toHaveBeenCalledWith({
      where: { id: "ss-1" },
      data: { updatedAt: expect.any(Date) },
    });
  });
});
