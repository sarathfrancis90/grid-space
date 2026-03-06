import prisma from "../models/prisma";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../utils/AppError";
import logger from "../utils/logger";

// ─── Types ──────────────────────────────────────────────

export type ExtensionPermission =
  | "read:cells"
  | "write:cells"
  | "read:sheets"
  | "write:sheets"
  | "read:metadata"
  | "write:metadata"
  | "ui:sidebar"
  | "ui:dialog"
  | "network:fetch";

const VALID_PERMISSIONS: ReadonlySet<string> = new Set<string>([
  "read:cells",
  "write:cells",
  "read:sheets",
  "write:sheets",
  "read:metadata",
  "write:metadata",
  "ui:sidebar",
  "ui:dialog",
  "network:fetch",
]);

interface ExtensionSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  iconUrl: string | null;
  permissions: string[];
  isPublished: boolean;
  isVerified: boolean;
  installCount: number;
  author: { id: string; name: string | null };
  createdAt: Date;
  updatedAt: Date;
}

interface ExtensionDetail extends ExtensionSummary {
  entryPoint: string;
  sourceCode: string;
  config: unknown;
}

interface ExtensionInstallInfo {
  id: string;
  extensionId: string;
  userId: string;
  isEnabled: boolean;
  settings: unknown;
  extension: ExtensionSummary;
  createdAt: Date;
}

const SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  version: true,
  iconUrl: true,
  permissions: true,
  isPublished: true,
  isVerified: true,
  installCount: true,
  author: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
};

const DETAIL_SELECT = {
  ...SUMMARY_SELECT,
  entryPoint: true,
  sourceCode: true,
  config: true,
};

// ─── Marketplace ────────────────────────────────────────

export async function listPublishedExtensions(): Promise<ExtensionSummary[]> {
  return prisma.extension.findMany({
    where: { isPublished: true },
    select: SUMMARY_SELECT,
    orderBy: { installCount: "desc" },
  });
}

export async function getExtension(slug: string): Promise<ExtensionDetail> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: DETAIL_SELECT,
  });
  if (!ext) throw new NotFoundError("Extension not found");
  return ext;
}

// ─── Author CRUD ────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validatePermissions(permissions: string[]): void {
  for (const p of permissions) {
    if (!VALID_PERMISSIONS.has(p)) {
      throw new ValidationError(`Invalid permission: ${p}`);
    }
  }
}

export async function createExtension(
  userId: string,
  data: {
    name: string;
    description?: string;
    version?: string;
    permissions?: string[];
    entryPoint?: string;
    sourceCode?: string;
    iconUrl?: string;
  },
): Promise<ExtensionDetail> {
  const slug = slugify(data.name);
  if (!slug) throw new ValidationError("Invalid extension name");

  const existing = await prisma.extension.findUnique({ where: { slug } });
  if (existing) throw new ValidationError("Extension slug already taken");

  if (data.permissions) {
    validatePermissions(data.permissions);
  }

  const ext = await prisma.extension.create({
    data: {
      authorId: userId,
      name: data.name,
      slug,
      description: data.description ?? "",
      version: data.version ?? "1.0.0",
      permissions: data.permissions ?? [],
      entryPoint: data.entryPoint ?? "index.js",
      sourceCode: data.sourceCode ?? "",
      iconUrl: data.iconUrl,
    },
    select: DETAIL_SELECT,
  });

  logger.info({ userId, extensionId: ext.id, slug }, "Extension created");
  return ext;
}

export async function updateExtension(
  userId: string,
  slug: string,
  data: {
    name?: string;
    description?: string;
    version?: string;
    permissions?: string[];
    entryPoint?: string;
    sourceCode?: string;
    iconUrl?: string | null;
    isPublished?: boolean;
  },
): Promise<ExtensionDetail> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  });
  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.authorId !== userId) {
    throw new ForbiddenError("Only the author can update this extension");
  }

  if (data.permissions) {
    validatePermissions(data.permissions);
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.version !== undefined) updateData.version = data.version;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.entryPoint !== undefined) updateData.entryPoint = data.entryPoint;
  if (data.sourceCode !== undefined) updateData.sourceCode = data.sourceCode;
  if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

  const updated = await prisma.extension.update({
    where: { slug },
    data: updateData,
    select: DETAIL_SELECT,
  });

  logger.info({ userId, extensionId: ext.id }, "Extension updated");
  return updated;
}

export async function deleteExtension(
  userId: string,
  slug: string,
): Promise<void> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: { id: true, authorId: true },
  });
  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.authorId !== userId) {
    throw new ForbiddenError("Only the author can delete this extension");
  }

  await prisma.extension.delete({ where: { slug } });
  logger.info({ userId, extensionId: ext.id, slug }, "Extension deleted");
}

export async function listMyExtensions(
  userId: string,
): Promise<ExtensionSummary[]> {
  return prisma.extension.findMany({
    where: { authorId: userId },
    select: SUMMARY_SELECT,
    orderBy: { updatedAt: "desc" },
  });
}

// ─── Install / Uninstall Lifecycle ──────────────────────

export async function installExtension(
  userId: string,
  slug: string,
): Promise<ExtensionInstallInfo> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: { authorId: true, ...SUMMARY_SELECT },
  });
  if (!ext) throw new NotFoundError("Extension not found");
  if (!ext.isPublished && ext.authorId !== userId) {
    throw new ForbiddenError("Extension is not published");
  }

  const existing = await prisma.extensionInstall.findUnique({
    where: { extensionId_userId: { extensionId: ext.id, userId } },
  });
  if (existing) throw new ValidationError("Extension already installed");

  const [install] = await prisma.$transaction([
    prisma.extensionInstall.create({
      data: { extensionId: ext.id, userId },
      select: {
        id: true,
        extensionId: true,
        userId: true,
        isEnabled: true,
        settings: true,
        createdAt: true,
        extension: { select: SUMMARY_SELECT },
      },
    }),
    prisma.extension.update({
      where: { id: ext.id },
      data: { installCount: { increment: 1 } },
    }),
  ]);

  logger.info({ userId, extensionId: ext.id, slug }, "Extension installed");
  return install;
}

export async function uninstallExtension(
  userId: string,
  slug: string,
): Promise<void> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!ext) throw new NotFoundError("Extension not found");

  const install = await prisma.extensionInstall.findUnique({
    where: { extensionId_userId: { extensionId: ext.id, userId } },
  });
  if (!install) throw new NotFoundError("Extension not installed");

  await prisma.$transaction([
    prisma.extensionInstall.delete({ where: { id: install.id } }),
    prisma.extension.update({
      where: { id: ext.id },
      data: { installCount: { decrement: 1 } },
    }),
  ]);

  logger.info({ userId, extensionId: ext.id, slug }, "Extension uninstalled");
}

export async function listInstalledExtensions(
  userId: string,
): Promise<ExtensionInstallInfo[]> {
  return prisma.extensionInstall.findMany({
    where: { userId },
    select: {
      id: true,
      extensionId: true,
      userId: true,
      isEnabled: true,
      settings: true,
      createdAt: true,
      extension: { select: SUMMARY_SELECT },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleExtension(
  userId: string,
  slug: string,
  isEnabled: boolean,
): Promise<{ id: string; isEnabled: boolean }> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!ext) throw new NotFoundError("Extension not found");

  const install = await prisma.extensionInstall.findUnique({
    where: { extensionId_userId: { extensionId: ext.id, userId } },
  });
  if (!install) throw new NotFoundError("Extension not installed");

  const updated = await prisma.extensionInstall.update({
    where: { id: install.id },
    data: { isEnabled },
    select: { id: true, isEnabled: true },
  });

  logger.info({ userId, extensionId: ext.id, isEnabled }, "Extension toggled");
  return updated;
}

export async function updateExtensionSettings(
  userId: string,
  slug: string,
  settings: Record<string, unknown>,
): Promise<{ id: string; settings: unknown }> {
  const ext = await prisma.extension.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!ext) throw new NotFoundError("Extension not found");

  const install = await prisma.extensionInstall.findUnique({
    where: { extensionId_userId: { extensionId: ext.id, userId } },
  });
  if (!install) throw new NotFoundError("Extension not installed");

  const updated = await prisma.extensionInstall.update({
    where: { id: install.id },
    data: { settings: settings as Record<string, string> },
    select: { id: true, settings: true },
  });

  return updated;
}
