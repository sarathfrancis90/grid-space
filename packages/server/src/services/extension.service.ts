import prisma from "../models/prisma";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../utils/AppError";
import logger from "../utils/logger";

const VALID_PERMISSIONS = [
  "spreadsheet:read",
  "spreadsheet:write",
  "cells:read",
  "cells:write",
  "formatting:read",
  "formatting:write",
  "sheets:read",
  "sheets:manage",
  "charts:read",
  "charts:write",
  "ui:sidebar",
  "ui:dialog",
  "ui:menu",
  "network:fetch",
  "storage:local",
] as const;

interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: { name: string; email?: string; url?: string };
  permissions: string[];
  entryPoint: string;
  minAppVersion?: string;
  icon?: string;
  menuItems?: Array<{ label: string; handler: string; menu: string }>;
  csp?: string;
  homepage?: string;
}

interface ExtensionRecord {
  id: string;
  extensionId: string;
  manifest: unknown;
  status: string;
  grantedPerms: string[];
  localStorage: unknown;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SELECT_FIELDS = {
  id: true,
  extensionId: true,
  manifest: true,
  status: true,
  grantedPerms: true,
  localStorage: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
};

function validateManifest(manifest: unknown): ExtensionManifest {
  if (!manifest || typeof manifest !== "object") {
    throw new ValidationError("Invalid manifest: must be an object");
  }

  const m = manifest as Record<string, unknown>;

  if (typeof m.id !== "string" || m.id.length === 0) {
    throw new ValidationError("Invalid manifest: id is required");
  }
  if (typeof m.name !== "string" || m.name.length === 0) {
    throw new ValidationError("Invalid manifest: name is required");
  }
  if (typeof m.version !== "string" || m.version.length === 0) {
    throw new ValidationError("Invalid manifest: version is required");
  }
  if (typeof m.description !== "string") {
    throw new ValidationError("Invalid manifest: description is required");
  }
  if (!m.author || typeof m.author !== "object") {
    throw new ValidationError("Invalid manifest: author is required");
  }
  const author = m.author as Record<string, unknown>;
  if (typeof author.name !== "string") {
    throw new ValidationError("Invalid manifest: author.name is required");
  }
  if (typeof m.entryPoint !== "string" || m.entryPoint.length === 0) {
    throw new ValidationError("Invalid manifest: entryPoint is required");
  }
  if (!Array.isArray(m.permissions)) {
    throw new ValidationError("Invalid manifest: permissions must be an array");
  }

  for (const perm of m.permissions) {
    if (
      !VALID_PERMISSIONS.includes(perm as (typeof VALID_PERMISSIONS)[number])
    ) {
      throw new ValidationError(`Invalid permission: ${String(perm)}`);
    }
  }

  return manifest as ExtensionManifest;
}

/** List all extensions installed by a user */
export async function listExtensions(
  userId: string,
): Promise<ExtensionRecord[]> {
  return prisma.extension.findMany({
    where: { userId },
    select: SELECT_FIELDS,
    orderBy: { createdAt: "desc" },
  });
}

/** Get a single extension by record ID */
export async function getExtension(
  userId: string,
  id: string,
): Promise<ExtensionRecord> {
  const ext = await prisma.extension.findUnique({
    where: { id },
    select: { ...SELECT_FIELDS, userId: true },
  });

  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.userId !== userId) throw new ForbiddenError("Access denied");

  return ext;
}

/** Install an extension from a manifest */
export async function installExtension(
  userId: string,
  manifest: unknown,
  grantedPermissions: string[],
): Promise<ExtensionRecord> {
  const validManifest = validateManifest(manifest);

  // Verify granted permissions are a subset of requested
  for (const perm of grantedPermissions) {
    if (!validManifest.permissions.includes(perm)) {
      throw new ValidationError(
        `Permission "${perm}" was not requested by the extension`,
      );
    }
  }

  // Check if already installed
  const existing = await prisma.extension.findUnique({
    where: {
      userId_extensionId: { userId, extensionId: validManifest.id },
    },
  });

  if (existing) {
    throw new ValidationError(
      `Extension "${validManifest.id}" is already installed`,
    );
  }

  const ext = await prisma.extension.create({
    data: {
      userId,
      extensionId: validManifest.id,
      manifest: validManifest as object,
      status: "installed",
      grantedPerms: grantedPermissions,
    },
    select: SELECT_FIELDS,
  });

  logger.info({ userId, extensionId: validManifest.id }, "Extension installed");

  return ext;
}

/** Uninstall an extension */
export async function uninstallExtension(
  userId: string,
  id: string,
): Promise<void> {
  const ext = await prisma.extension.findUnique({
    where: { id },
    select: { userId: true, extensionId: true },
  });

  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.userId !== userId) throw new ForbiddenError("Access denied");

  await prisma.extension.delete({ where: { id } });

  logger.info(
    { userId, extensionId: ext.extensionId },
    "Extension uninstalled",
  );
}

/** Update extension status (activate, disable, error) */
export async function updateExtensionStatus(
  userId: string,
  id: string,
  status: string,
  errorMessage?: string,
): Promise<ExtensionRecord> {
  const validStatuses = ["installed", "active", "disabled", "error"];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`);
  }

  const ext = await prisma.extension.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.userId !== userId) throw new ForbiddenError("Access denied");

  return prisma.extension.update({
    where: { id },
    data: {
      status,
      errorMessage: status === "error" ? errorMessage : null,
    },
    select: SELECT_FIELDS,
  });
}

/** Update granted permissions for an extension */
export async function updatePermissions(
  userId: string,
  id: string,
  grantedPermissions: string[],
): Promise<ExtensionRecord> {
  const ext = await prisma.extension.findUnique({
    where: { id },
    select: { userId: true, manifest: true },
  });

  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.userId !== userId) throw new ForbiddenError("Access denied");

  const manifest = validateManifest(ext.manifest);
  for (const perm of grantedPermissions) {
    if (!manifest.permissions.includes(perm)) {
      throw new ValidationError(
        `Permission "${perm}" was not requested by the extension`,
      );
    }
  }

  return prisma.extension.update({
    where: { id },
    data: { grantedPerms: grantedPermissions },
    select: SELECT_FIELDS,
  });
}

/** Update extension-local storage */
export async function updateStorage(
  userId: string,
  id: string,
  key: string,
  value: string | null,
): Promise<void> {
  const ext = await prisma.extension.findUnique({
    where: { id },
    select: { userId: true, grantedPerms: true, localStorage: true },
  });

  if (!ext) throw new NotFoundError("Extension not found");
  if (ext.userId !== userId) throw new ForbiddenError("Access denied");

  if (!ext.grantedPerms.includes("storage:local")) {
    throw new ForbiddenError(
      "Extension does not have storage:local permission",
    );
  }

  const storage = (ext.localStorage as Record<string, string>) ?? {};
  if (value === null) {
    delete storage[key];
  } else {
    storage[key] = value;
  }

  await prisma.extension.update({
    where: { id },
    data: { localStorage: storage },
  });
}
