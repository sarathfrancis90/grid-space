import crypto from "crypto";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError, AppError } from "../utils/AppError";
import logger from "../utils/logger";
import { sendShareInvite } from "./email.service";
import { env } from "../config/env";

type Role = "viewer" | "commenter" | "editor" | "owner";

interface Collaborator {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  pending?: boolean;
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

/** List collaborators for a spreadsheet (includes pending invites) */
export async function listCollaborators(
  spreadsheetId: string,
  userId: string,
): Promise<Collaborator[]> {
  // Any user with access can view collaborators
  const role = await checkUserRole(spreadsheetId, userId);
  if (!role) throw new ForbiddenError("Access denied");

  const [access, pending] = await Promise.all([
    prisma.spreadsheetAccess.findMany({
      where: { spreadsheetId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pendingInvite.findMany({
      where: { spreadsheetId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pendingCollaborators: Collaborator[] = pending.map((p) => ({
    id: p.id,
    userId: `pending-${p.id}`,
    role: p.role,
    createdAt: p.createdAt,
    pending: true,
    user: {
      id: `pending-${p.id}`,
      name: null,
      email: p.email,
      avatarUrl: null,
    },
  }));

  return [...access, ...pendingCollaborators];
}

/** Add a collaborator by email (creates pending invite if user not registered) */
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
    // User not registered — create a pending invite
    const existingInvite = await prisma.pendingInvite.findUnique({
      where: { spreadsheetId_email: { spreadsheetId, email } },
    });

    if (existingInvite) {
      throw new AppError(
        409,
        "An invitation is already pending for this email",
      );
    }

    const invite = await prisma.pendingInvite.create({
      data: {
        spreadsheetId,
        email,
        role,
        invitedById: actorId,
      },
    });

    logger.info(
      { actorId, spreadsheetId, email, role },
      "Pending invite created for unregistered user",
    );

    // Send invitation email (fire-and-forget, don't block the response)
    const [inviter, spreadsheet] = await Promise.all([
      prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true, email: true },
      }),
      prisma.spreadsheet.findUnique({
        where: { id: spreadsheetId },
        select: { title: true },
      }),
    ]);
    const inviterName = inviter?.name || inviter?.email || "Someone";
    const title = spreadsheet?.title || "Untitled Spreadsheet";
    const spreadsheetUrl = `${env.CLIENT_URL}/spreadsheet/${spreadsheetId}`;
    sendShareInvite(email, inviterName, title, role, spreadsheetUrl).catch(
      (err) => logger.error({ err, email }, "Failed to send invite email"),
    );

    return {
      id: invite.id,
      userId: `pending-${invite.id}`,
      role: invite.role,
      createdAt: invite.createdAt,
      pending: true,
      user: {
        id: `pending-${invite.id}`,
        name: null,
        email: invite.email,
        avatarUrl: null,
      },
    };
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

/** Remove a collaborator or pending invite */
export async function removeCollaborator(
  spreadsheetId: string,
  actorId: string,
  targetUserId: string,
): Promise<void> {
  await requireOwner(spreadsheetId, actorId);

  // Check if this is a pending invite (id starts with "pending-")
  if (targetUserId.startsWith("pending-")) {
    const inviteId = targetUserId.replace("pending-", "");
    const invite = await prisma.pendingInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.spreadsheetId !== spreadsheetId) {
      throw new NotFoundError("Pending invite not found");
    }
    await prisma.pendingInvite.delete({ where: { id: inviteId } });
    logger.info({ actorId, spreadsheetId, inviteId }, "Pending invite removed");
    return;
  }

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
export async function accessViaShareLink(
  shareToken: string,
  userId?: string,
): Promise<{
  spreadsheetId: string;
  role: string;
}> {
  const ss = await prisma.spreadsheet.findFirst({
    where: { shareLink: shareToken },
    select: { id: true, shareLinkRole: true, ownerId: true },
  });

  if (!ss || !ss.shareLinkRole) {
    throw new NotFoundError("Invalid or expired share link");
  }

  // If authenticated user is accessing via share link, grant them access
  if (userId && userId !== ss.ownerId) {
    const existing = await prisma.spreadsheetAccess.findUnique({
      where: {
        spreadsheetId_userId: { spreadsheetId: ss.id, userId },
      },
    });

    if (!existing) {
      await prisma.spreadsheetAccess.create({
        data: {
          spreadsheetId: ss.id,
          userId,
          role: ss.shareLinkRole,
        },
      });

      logger.info(
        { userId, spreadsheetId: ss.id, role: ss.shareLinkRole },
        "Access granted via share link",
      );
    }
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

/** Claim all pending invites for a newly registered email */
export async function claimPendingInvites(
  userId: string,
  email: string,
): Promise<void> {
  const invites = await prisma.pendingInvite.findMany({
    where: { email },
  });

  if (invites.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const invite of invites) {
      // Grant access (skip if somehow already exists)
      await tx.spreadsheetAccess.upsert({
        where: {
          spreadsheetId_userId: {
            spreadsheetId: invite.spreadsheetId,
            userId,
          },
        },
        update: { role: invite.role },
        create: {
          spreadsheetId: invite.spreadsheetId,
          userId,
          role: invite.role,
        },
      });
    }

    // Delete all pending invites for this email
    await tx.pendingInvite.deleteMany({ where: { email } });
  });

  logger.info(
    { userId, email, count: invites.length },
    "Pending invites claimed on registration",
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
