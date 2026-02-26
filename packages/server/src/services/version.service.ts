import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

const MAX_VERSIONS = 200;

interface VersionUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface VersionSummary {
  id: string;
  name: string | null;
  createdAt: Date;
  createdBy: VersionUser;
  hasChangeset: boolean;
}

interface VersionDetail {
  id: string;
  name: string | null;
  snapshot: unknown;
  changeset: unknown;
  createdAt: Date;
  createdBy: VersionUser;
}

interface VersionDiff {
  sheetId: string;
  sheetName: string;
  changes: Array<{
    cellKey: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

/** Check user access to spreadsheet — returns role or throws */
async function checkAccess(
  spreadsheetId: string,
  userId: string,
  minRole?: "viewer" | "editor" | "owner",
): Promise<string> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  if (spreadsheet.ownerId === userId) {
    return "owner";
  }

  const access = spreadsheet.access[0];
  if (!access) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }

  const role = access.role;

  if (minRole === "owner" && role !== "owner") {
    throw new ForbiddenError("Only the owner can perform this action");
  }

  if (minRole === "editor" && role !== "editor" && role !== "owner") {
    throw new ForbiddenError("You need editor access to perform this action");
  }

  return role;
}

/** Compute changeset (delta) between two snapshots */
function computeChangeset(
  oldSnapshot: Record<string, unknown>,
  newSnapshot: Record<string, unknown>,
): object {
  const oldSheets = (oldSnapshot.sheets ?? []) as Array<{
    id: string;
    name: string;
    cellData: Record<string, unknown>;
  }>;
  const newSheets = (newSnapshot.sheets ?? []) as Array<{
    id: string;
    name: string;
    cellData: Record<string, unknown>;
  }>;

  const oldMap = new Map(oldSheets.map((s) => [s.id, s]));
  const newMap = new Map(newSheets.map((s) => [s.id, s]));

  const sheetChanges: Array<{
    sheetId: string;
    sheetName: string;
    cellChanges: Record<string, { old: unknown; new: unknown }>;
  }> = [];

  for (const [sheetId, newSheet] of newMap) {
    const oldSheet = oldMap.get(sheetId);
    if (!oldSheet) {
      sheetChanges.push({
        sheetId,
        sheetName: newSheet.name,
        cellChanges: { __added__: { old: null, new: newSheet.cellData } },
      });
      continue;
    }

    const cellChanges: Record<string, { old: unknown; new: unknown }> = {};
    const oldCells = oldSheet.cellData ?? {};
    const newCells = newSheet.cellData ?? {};

    for (const [key, val] of Object.entries(newCells)) {
      if (JSON.stringify(oldCells[key]) !== JSON.stringify(val)) {
        cellChanges[key] = { old: oldCells[key] ?? null, new: val };
      }
    }

    for (const key of Object.keys(oldCells)) {
      if (!(key in newCells)) {
        cellChanges[key] = { old: oldCells[key], new: null };
      }
    }

    if (Object.keys(cellChanges).length > 0) {
      sheetChanges.push({
        sheetId,
        sheetName: newSheet.name,
        cellChanges,
      });
    }
  }

  for (const [sheetId, oldSheet] of oldMap) {
    if (!newMap.has(sheetId)) {
      sheetChanges.push({
        sheetId,
        sheetName: oldSheet.name,
        cellChanges: { __deleted__: { old: oldSheet.cellData, new: null } },
      });
    }
  }

  return { sheetChanges };
}

async function getVersionUser(userId: string): Promise<VersionUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarUrl: true },
  });
  return user ?? { id: userId, name: null, avatarUrl: null };
}

/** Create a version snapshot — auto-called on save */
export async function createVersion(
  spreadsheetId: string,
  userId: string,
): Promise<VersionSummary> {
  await checkAccess(spreadsheetId, userId, "editor");

  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      title: true,
      sheets: {
        orderBy: { index: "asc" },
        select: {
          id: true,
          name: true,
          index: true,
          color: true,
          isHidden: true,
          cellData: true,
          columnMeta: true,
          rowMeta: true,
          frozenRows: true,
          frozenCols: true,
          filterState: true,
          sortState: true,
        },
      },
    },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  // Deep clone to ensure clean JSON
  const snapshotObj = JSON.parse(
    JSON.stringify({ title: spreadsheet.title, sheets: spreadsheet.sheets }),
  );

  // Get previous version to compute delta
  const previousVersion = await prisma.version.findFirst({
    where: { spreadsheetId },
    orderBy: { createdAt: "desc" },
    select: { snapshot: true },
  });

  const changesetObj = previousVersion
    ? computeChangeset(
        previousVersion.snapshot as Record<string, unknown>,
        snapshotObj as Record<string, unknown>,
      )
    : undefined;

  const version = await prisma.version.create({
    data: {
      spreadsheetId,
      createdById: userId,
      snapshot: snapshotObj,
      changeset: changesetObj,
    },
  });

  const createdBy = await getVersionUser(userId);

  await pruneOldVersions(spreadsheetId);

  logger.info(
    { userId, spreadsheetId, versionId: version.id },
    "Version created",
  );

  return {
    id: version.id,
    name: version.name,
    createdAt: version.createdAt,
    createdBy,
    hasChangeset: version.changeset !== null,
  };
}

/** List versions for a spreadsheet (paginated, newest first) */
export async function listVersions(
  spreadsheetId: string,
  userId: string,
  options: { page: number; limit: number; skip: number },
): Promise<{ versions: VersionSummary[]; total: number }> {
  await checkAccess(spreadsheetId, userId);

  const [versions, total] = await Promise.all([
    prisma.version.findMany({
      where: { spreadsheetId },
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.limit,
      include: {
        createdBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    }),
    prisma.version.count({ where: { spreadsheetId } }),
  ]);

  const mapped: VersionSummary[] = versions.map((v) => ({
    id: v.id,
    name: v.name,
    createdAt: v.createdAt,
    createdBy: v.createdBy,
    hasChangeset: v.changeset !== null,
  }));

  return { versions: mapped, total };
}

/** Get a single version with full snapshot */
export async function getVersion(
  spreadsheetId: string,
  versionId: string,
  userId: string,
): Promise<VersionDetail> {
  await checkAccess(spreadsheetId, userId);

  const version = await prisma.version.findFirst({
    where: { id: versionId, spreadsheetId },
    include: {
      createdBy: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  if (!version) {
    throw new NotFoundError("Version not found");
  }

  return {
    id: version.id,
    name: version.name,
    snapshot: version.snapshot,
    changeset: version.changeset,
    createdAt: version.createdAt,
    createdBy: version.createdBy,
  };
}

/** Restore a version — replace current sheets with version snapshot */
export async function restoreVersion(
  spreadsheetId: string,
  versionId: string,
  userId: string,
): Promise<void> {
  await checkAccess(spreadsheetId, userId, "editor");

  const version = await prisma.version.findFirst({
    where: { id: versionId, spreadsheetId },
    select: { snapshot: true },
  });

  if (!version) {
    throw new NotFoundError("Version not found");
  }

  const snapshot = version.snapshot as {
    title?: string;
    sheets: Array<{
      id: string;
      name: string;
      index: number;
      color: string | null;
      isHidden: boolean;
      cellData: object;
      columnMeta: object;
      rowMeta: object;
      frozenRows: number;
      frozenCols: number;
      filterState: object | null;
      sortState: object | null;
    }>;
  };

  await prisma.$transaction(async (tx) => {
    await tx.sheet.deleteMany({ where: { spreadsheetId } });

    for (const sheet of snapshot.sheets) {
      await tx.sheet.create({
        data: {
          spreadsheetId,
          name: sheet.name,
          index: sheet.index,
          color: sheet.color,
          isHidden: sheet.isHidden,
          cellData: sheet.cellData ?? {},
          columnMeta: sheet.columnMeta ?? {},
          rowMeta: sheet.rowMeta ?? {},
          frozenRows: sheet.frozenRows ?? 0,
          frozenCols: sheet.frozenCols ?? 0,
          filterState: sheet.filterState ?? undefined,
          sortState: sheet.sortState ?? undefined,
        },
      });
    }
  });

  await createVersion(spreadsheetId, userId);

  logger.info({ userId, spreadsheetId, versionId }, "Version restored");
}

/** Name/label a version */
export async function nameVersion(
  spreadsheetId: string,
  versionId: string,
  userId: string,
  name: string,
): Promise<VersionSummary> {
  await checkAccess(spreadsheetId, userId, "editor");

  const version = await prisma.version.findFirst({
    where: { id: versionId, spreadsheetId },
  });

  if (!version) {
    throw new NotFoundError("Version not found");
  }

  const updated = await prisma.version.update({
    where: { id: versionId },
    data: { name },
    include: {
      createdBy: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    createdAt: updated.createdAt,
    createdBy: updated.createdBy,
    hasChangeset: updated.changeset !== null,
  };
}

/** Get diff between two versions */
export async function diffVersions(
  spreadsheetId: string,
  versionId: string,
  compareToId: string | undefined,
  userId: string,
): Promise<VersionDiff[]> {
  await checkAccess(spreadsheetId, userId);

  const version = await prisma.version.findFirst({
    where: { id: versionId, spreadsheetId },
    select: { snapshot: true, createdAt: true },
  });

  if (!version) {
    throw new NotFoundError("Version not found");
  }

  let compareSnapshot: unknown;

  if (compareToId) {
    const compareTo = await prisma.version.findFirst({
      where: { id: compareToId, spreadsheetId },
      select: { snapshot: true },
    });
    if (!compareTo) {
      throw new NotFoundError("Comparison version not found");
    }
    compareSnapshot = compareTo.snapshot;
  } else {
    const prev = await prisma.version.findFirst({
      where: {
        spreadsheetId,
        createdAt: { lt: version.createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { snapshot: true },
    });
    compareSnapshot = prev?.snapshot ?? { sheets: [] };
  }

  const oldSnap = compareSnapshot as {
    sheets: Array<{
      id: string;
      name: string;
      cellData: Record<string, unknown>;
    }>;
  };
  const newSnap = version.snapshot as {
    sheets: Array<{
      id: string;
      name: string;
      cellData: Record<string, unknown>;
    }>;
  };

  const diffs: VersionDiff[] = [];
  const oldMap = new Map((oldSnap.sheets ?? []).map((s) => [s.id, s]));
  const newMap = new Map((newSnap.sheets ?? []).map((s) => [s.id, s]));

  for (const [sheetId, newSheet] of newMap) {
    const oldSheet = oldMap.get(sheetId);
    const oldCells = oldSheet?.cellData ?? {};
    const newCells = newSheet.cellData ?? {};

    const changes: VersionDiff["changes"] = [];

    for (const [key, val] of Object.entries(newCells)) {
      if (JSON.stringify(oldCells[key]) !== JSON.stringify(val)) {
        changes.push({
          cellKey: key,
          oldValue: oldCells[key] ?? null,
          newValue: val,
        });
      }
    }

    for (const key of Object.keys(oldCells)) {
      if (!(key in newCells)) {
        changes.push({ cellKey: key, oldValue: oldCells[key], newValue: null });
      }
    }

    if (changes.length > 0) {
      diffs.push({ sheetId, sheetName: newSheet.name, changes });
    }
  }

  return diffs;
}

/** Copy a version as a new spreadsheet */
export async function copyVersionAsSpreadsheet(
  spreadsheetId: string,
  versionId: string,
  userId: string,
): Promise<{ id: string; title: string }> {
  await checkAccess(spreadsheetId, userId);

  const version = await prisma.version.findFirst({
    where: { id: versionId, spreadsheetId },
    select: { snapshot: true, name: true },
  });

  if (!version) {
    throw new NotFoundError("Version not found");
  }

  const snapshot = version.snapshot as {
    title?: string;
    sheets: Array<{
      name: string;
      index: number;
      color: string | null;
      cellData: object;
      columnMeta: object;
      rowMeta: object;
      frozenRows: number;
      frozenCols: number;
    }>;
  };

  const title = `${snapshot.title ?? "Untitled"} (Version: ${version.name ?? "unnamed"})`;

  const newSpreadsheet = await prisma.$transaction(async (tx) => {
    return tx.spreadsheet.create({
      data: {
        title,
        ownerId: userId,
        sheets: {
          create: (snapshot.sheets ?? []).map((s) => ({
            name: s.name,
            index: s.index,
            color: s.color,
            cellData: s.cellData ?? {},
            columnMeta: s.columnMeta ?? {},
            rowMeta: s.rowMeta ?? {},
            frozenRows: s.frozenRows ?? 0,
            frozenCols: s.frozenCols ?? 0,
          })),
        },
        access: {
          create: { userId, role: "owner" },
        },
      },
      select: { id: true, title: true },
    });
  });

  logger.info(
    { userId, spreadsheetId, versionId, newId: newSpreadsheet.id },
    "Version copied as new spreadsheet",
  );

  return newSpreadsheet;
}

/** Prune old versions beyond MAX_VERSIONS limit */
async function pruneOldVersions(spreadsheetId: string): Promise<void> {
  const count = await prisma.version.count({ where: { spreadsheetId } });

  if (count <= MAX_VERSIONS) return;

  const toDelete = count - MAX_VERSIONS;

  const oldest = await prisma.version.findMany({
    where: { spreadsheetId },
    orderBy: { createdAt: "asc" },
    take: toDelete,
    select: { id: true },
  });

  if (oldest.length > 0) {
    await prisma.version.deleteMany({
      where: { id: { in: oldest.map((v) => v.id) } },
    });

    logger.info(
      { spreadsheetId, deleted: oldest.length },
      "Pruned old versions",
    );
  }
}

/** Group versions by time period (for UI grouping) */
export async function listGroupedVersions(
  spreadsheetId: string,
  userId: string,
): Promise<
  Array<{
    period: string;
    versions: VersionSummary[];
  }>
> {
  await checkAccess(spreadsheetId, userId);

  const versions = await prisma.version.findMany({
    where: { spreadsheetId },
    orderBy: { createdAt: "desc" },
    take: MAX_VERSIONS,
    include: {
      createdBy: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: Map<string, VersionSummary[]> = new Map();

  for (const v of versions) {
    const vDate = new Date(v.createdAt);
    let period: string;

    if (vDate >= today) {
      period = "Today";
    } else if (vDate >= yesterday) {
      period = "Yesterday";
    } else if (vDate >= lastWeek) {
      period = "This week";
    } else {
      period = vDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    if (!groups.has(period)) {
      groups.set(period, []);
    }

    groups.get(period)!.push({
      id: v.id,
      name: v.name,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      hasChangeset: v.changeset !== null,
    });
  }

  return Array.from(groups.entries()).map(([period, vers]) => ({
    period,
    versions: vers,
  }));
}
