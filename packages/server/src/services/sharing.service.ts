import crypto from "crypto";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError, AppError } from "../utils/AppError";
import logger from "../utils/logger";

type Role = "viewer" | "commenter" | "editor" | "owner";

interface Collaborator {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

/** Verify that userId is the owner of the spreadsheet */
async function requireOwner(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: { ownerId: true },
  });
  if (!ss) throw new NotFoundError("Spreadsheet not found");
  if (ss.ownerId !== userId) {
    throw new ForbiddenError("Only the owner can perform this action");
  }
}

/** Verify that userId has at least editor access */
async function requireEditor(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });
  if (!ss) throw new NotFoundError("Spreadsheet not found");
  if (ss.ownerId === userId) return;
  const role = ss.access[0]?.role;
  if (role !== "editor" && role !== "owner") {
    throw new ForbiddenError("You need editor access to manage sharing");
  }
}

/** Check if the user has any access to the spreadsheet */
export async function checkUserRole(
  spreadsheetId: string,
  userId: string,
): Promise<Role | null> {
  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { role: true } },
    },
  });
  if (!ss) return null;
  if (ss.ownerId === userId) return "owner";
  return (ss.access[0]?.role as Role) ?? null;
}

/** List collaborators for a spreadsheet */
export async function listCollaborators(
  spreadsheetId: string,
  userId: string,
): Promise<Collaborator[]> {
  // Any user with access can view collaborators
  const role = await checkUserRole(spreadsheetId, userId);
  if (!role) throw new ForbiddenError("Access denied");

  const access = await prisma.spreadsheetAccess.findMany({
    where: { spreadsheetId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return access;
}

/** Add a collaborator by email */
export async function addCollaborator(
  spreadsheetId: string,
  actorId: string,
  email: string,
  role: "viewer" | "commenter" | "editor",
): Promise<Collaborator> {
  await requireEditor(spreadsheetId, actorId);

  const targetUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!targetUser) {
    throw new NotFoundError("User not found with that email");
  }

  // Check if already has access
  const existing = await prisma.spreadsheetAccess.findUnique({
    where: {
      spreadsheetId_userId: { spreadsheetId, userId: targetUser.id },
    },
  });

  if (existing) {
    throw new AppError(409, "User already has access to this spreadsheet");
  }

  const access = await prisma.spreadsheetAccess.create({
    data: {
      spreadsheetId,
      userId: targetUser.id,
      role,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  logger.info(
    { actorId, spreadsheetId, targetUserId: targetUser.id, role },
    "Collaborator added",
  );

  return access;
}

/** Change a collaborator's role */
export async function changeRole(
  spreadsheetId: string,
  actorId: string,
  targetUserId: string,
  newRole: "viewer" | "commenter" | "editor",
): Promise<Collaborator> {
  await requireOwner(spreadsheetId, actorId);

  const access = await prisma.spreadsheetAccess.findUnique({
    where: {
      spreadsheetId_userId: { spreadsheetId, userId: targetUserId },
    },
  });

  if (!access) {
    throw new NotFoundError("User does not have access to this spreadsheet");
  }

  if (access.role === "owner") {
    throw new ForbiddenError("Cannot change owner's role");
  }

  const updated = await prisma.spreadsheetAccess.update({
    where: { id: access.id },
    data: { role: newRole },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  logger.info(
    { actorId, spreadsheetId, targetUserId, newRole },
    "Collaborator role changed",
  );

  return updated;
}

/** Remove a collaborator */
export async function removeCollaborator(
  spreadsheetId: string,
  actorId: string,
  targetUserId: string,
): Promise<void> {
  await requireOwner(spreadsheetId, actorId);

  const access = await prisma.spreadsheetAccess.findUnique({
    where: {
      spreadsheetId_userId: { spreadsheetId, userId: targetUserId },
    },
  });

  if (!access) {
    throw new NotFoundError("User does not have access");
  }

  if (access.role === "owner") {
    throw new ForbiddenError("Cannot remove the owner");
  }

  await prisma.spreadsheetAccess.delete({ where: { id: access.id } });

  logger.info({ actorId, spreadsheetId, targetUserId }, "Collaborator removed");
}

/** Create or update a share link */
export async function createShareLink(
  spreadsheetId: string,
  actorId: string,
  role: "viewer" | "commenter" | "editor",
): Promise<{ shareLink: string; shareLinkRole: string }> {
  await requireOwner(spreadsheetId, actorId);

  const token = crypto.randomBytes(32).toString("hex");

  const updated = await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: {
      shareLink: token,
      shareLinkRole: role,
    },
    select: { shareLink: true, shareLinkRole: true },
  });

  logger.info({ actorId, spreadsheetId, role }, "Share link created");

  return {
    shareLink: updated.shareLink as string,
    shareLinkRole: updated.shareLinkRole as string,
  };
}

/** Disable share link */
export async function disableShareLink(
  spreadsheetId: string,
  actorId: string,
): Promise<void> {
  await requireOwner(spreadsheetId, actorId);

  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { shareLink: null, shareLinkRole: null },
  });

  logger.info({ actorId, spreadsheetId }, "Share link disabled");
}

/** Get share link info */
export async function getShareLink(
  spreadsheetId: string,
  actorId: string,
): Promise<{ shareLink: string | null; shareLinkRole: string | null }> {
  const role = await checkUserRole(spreadsheetId, actorId);
  if (!role) throw new ForbiddenError("Access denied");

  const ss = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: { shareLink: true, shareLinkRole: true },
  });

  if (!ss) throw new NotFoundError("Spreadsheet not found");

  return { shareLink: ss.shareLink, shareLinkRole: ss.shareLinkRole };
}

/** Access spreadsheet via share link token */
export async function accessViaShareLink(shareToken: string): Promise<{
  spreadsheetId: string;
  role: string;
}> {
  const ss = await prisma.spreadsheet.findFirst({
    where: { shareLink: shareToken },
    select: { id: true, shareLinkRole: true },
  });

  if (!ss || !ss.shareLinkRole) {
    throw new NotFoundError("Invalid or expired share link");
  }

  return { spreadsheetId: ss.id, role: ss.shareLinkRole };
}

/** Transfer ownership to another user */
export async function transferOwnership(
  spreadsheetId: string,
  actorId: string,
  newOwnerEmail: string,
): Promise<void> {
  await requireOwner(spreadsheetId, actorId);

  const newOwner = await prisma.user.findUnique({
    where: { email: newOwnerEmail },
    select: { id: true },
  });

  if (!newOwner) {
    throw new NotFoundError("User not found with that email");
  }

  if (newOwner.id === actorId) {
    throw new AppError(400, "You are already the owner");
  }

  await prisma.$transaction(async (tx) => {
    // Change spreadsheet owner
    await tx.spreadsheet.update({
      where: { id: spreadsheetId },
      data: { ownerId: newOwner.id },
    });

    // Update or create new owner's access record
    await tx.spreadsheetAccess.upsert({
      where: {
        spreadsheetId_userId: {
          spreadsheetId,
          userId: newOwner.id,
        },
      },
      update: { role: "owner" },
      create: { spreadsheetId, userId: newOwner.id, role: "owner" },
    });

    // Demote previous owner to editor
    await tx.spreadsheetAccess.upsert({
      where: {
        spreadsheetId_userId: {
          spreadsheetId,
          userId: actorId,
        },
      },
      update: { role: "editor" },
      create: { spreadsheetId, userId: actorId, role: "editor" },
    });
  });

  logger.info(
    { actorId, spreadsheetId, newOwnerId: newOwner.id },
    "Ownership transferred",
  );
}

/** Publish to web — set public URL */
export async function publishToWeb(
  spreadsheetId: string,
  actorId: string,
): Promise<{ publishedUrl: string }> {
  await requireOwner(spreadsheetId, actorId);

  const token = crypto.randomBytes(16).toString("hex");

  const updated = await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { isPublished: true, publishedUrl: token },
    select: { publishedUrl: true },
  });

  return { publishedUrl: updated.publishedUrl as string };
}

/** Unpublish from web */
export async function unpublishFromWeb(
  spreadsheetId: string,
  actorId: string,
): Promise<void> {
  await requireOwner(spreadsheetId, actorId);

  await prisma.spreadsheet.update({
    where: { id: spreadsheetId },
    data: { isPublished: false, publishedUrl: null },
  });
}

/** Access a published spreadsheet (read-only, no auth required) */
export async function accessPublished(publishToken: string): Promise<{
  id: string;
  title: string;
  sheets: unknown[];
}> {
  const ss = await prisma.spreadsheet.findFirst({
    where: { publishedUrl: publishToken, isPublished: true },
    select: {
      id: true,
      title: true,
      sheets: {
        orderBy: { index: "asc" },
        select: {
          id: true,
          name: true,
          index: true,
          cellData: true,
          columnMeta: true,
          rowMeta: true,
        },
      },
    },
  });

  if (!ss) throw new NotFoundError("Published spreadsheet not found");

  return ss;
}
