import prisma from "../models/prisma";
import { NotFoundError } from "../utils/AppError";
import logger from "../utils/logger";
import { getPaginationParams } from "../utils/pagination";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  spreadsheetId: string | null;
  cellRef: string | null;
  fromUserId: string | null;
  fromUserName: string | null;
  fromUserEmail: string | null;
  createdAt: Date;
}

interface PreferenceData {
  emailSharing?: boolean;
  emailComments?: boolean;
  emailMentions?: boolean;
  inAppSharing?: boolean;
  inAppComments?: boolean;
  inAppMentions?: boolean;
}

/** List notifications for a user (paginated) */
export async function listNotifications(
  userId: string,
  query: { page?: string; limit?: string },
): Promise<{
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, skip } = getPaginationParams(query);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, total, page, limit };
}

/** Get unread count */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

/** Mark a notification as read */
export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<NotificationItem> {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notif || notif.userId !== userId) {
    throw new NotFoundError("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/** Mark a notification as unread */
export async function markAsUnread(
  userId: string,
  notificationId: string,
): Promise<NotificationItem> {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notif || notif.userId !== userId) {
    throw new NotFoundError("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: false },
  });
}

/** Mark all notifications as read */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/** Delete a notification */
export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<void> {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notif || notif.userId !== userId) {
    throw new NotFoundError("Notification not found");
  }

  await prisma.notification.delete({ where: { id: notificationId } });
}

/** Create a notification (internal — called by other services) */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  opts?: {
    spreadsheetId?: string;
    cellRef?: string;
    fromUserId?: string;
    fromUserName?: string;
    fromUserEmail?: string;
  },
): Promise<NotificationItem> {
  // Check user preferences before creating
  const prefs = await getPreferences(userId, opts?.spreadsheetId ?? null);

  if (type === "share" && !prefs.inAppSharing)
    return null as unknown as NotificationItem;
  if (type === "mention" && !prefs.inAppMentions)
    return null as unknown as NotificationItem;
  if (type === "comment_reply" && !prefs.inAppComments)
    return null as unknown as NotificationItem;

  const notif = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      spreadsheetId: opts?.spreadsheetId,
      cellRef: opts?.cellRef,
      fromUserId: opts?.fromUserId,
      fromUserName: opts?.fromUserName,
      fromUserEmail: opts?.fromUserEmail,
    },
  });

  logger.info(
    { userId, type, notificationId: notif.id },
    "Notification created",
  );

  return notif;
}

/** Get notification preferences for a user (global or per-spreadsheet) */
export async function getPreferences(
  userId: string,
  spreadsheetId: string | null,
): Promise<
  PreferenceData & {
    emailSharing: boolean;
    emailComments: boolean;
    emailMentions: boolean;
    inAppSharing: boolean;
    inAppComments: boolean;
    inAppMentions: boolean;
  }
> {
  // Try spreadsheet-specific prefs first
  if (spreadsheetId) {
    const specific = await prisma.notificationPreference.findUnique({
      where: { userId_spreadsheetId: { userId, spreadsheetId } },
    });
    if (specific) {
      return {
        emailSharing: specific.emailSharing,
        emailComments: specific.emailComments,
        emailMentions: specific.emailMentions,
        inAppSharing: specific.inAppSharing,
        inAppComments: specific.inAppComments,
        inAppMentions: specific.inAppMentions,
      };
    }
  }

  // Fall back to global prefs (spreadsheetId = null)
  const global = await prisma.notificationPreference.findFirst({
    where: { userId, spreadsheetId: null },
  });

  if (global) {
    return {
      emailSharing: global.emailSharing,
      emailComments: global.emailComments,
      emailMentions: global.emailMentions,
      inAppSharing: global.inAppSharing,
      inAppComments: global.inAppComments,
      inAppMentions: global.inAppMentions,
    };
  }

  // Default prefs
  return {
    emailSharing: false,
    emailComments: false,
    emailMentions: false,
    inAppSharing: true,
    inAppComments: true,
    inAppMentions: true,
  };
}

/** Update notification preferences */
export async function updatePreferences(
  userId: string,
  spreadsheetId: string | null,
  prefs: PreferenceData,
): Promise<PreferenceData> {
  const result = await prisma.notificationPreference.upsert({
    where: {
      userId_spreadsheetId: {
        userId,
        spreadsheetId: spreadsheetId ?? "",
      },
    },
    update: prefs,
    create: {
      userId,
      spreadsheetId,
      ...{
        emailSharing: prefs.emailSharing ?? false,
        emailComments: prefs.emailComments ?? false,
        emailMentions: prefs.emailMentions ?? false,
        inAppSharing: prefs.inAppSharing ?? true,
        inAppComments: prefs.inAppComments ?? true,
        inAppMentions: prefs.inAppMentions ?? true,
      },
    },
  });

  return {
    emailSharing: result.emailSharing,
    emailComments: result.emailComments,
    emailMentions: result.emailMentions,
    inAppSharing: result.inAppSharing,
    inAppComments: result.inAppComments,
    inAppMentions: result.inAppMentions,
  };
}

/** Notify mentioned users in a comment */
export async function notifyMentionedUsers(
  mentions: string[],
  actorId: string,
  actorName: string,
  actorEmail: string,
  spreadsheetId: string,
  cellRef: string,
  commentText: string,
): Promise<void> {
  for (const email of mentions) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user && user.id !== actorId) {
      await createNotification(
        user.id,
        "mention",
        "You were mentioned in a comment",
        `${actorName} mentioned you: "${commentText.slice(0, 100)}"`,
        {
          spreadsheetId,
          cellRef,
          fromUserId: actorId,
          fromUserName: actorName,
          fromUserEmail: actorEmail,
        },
      );
    }
  }
}

/** Notify comment thread participants about a reply */
export async function notifyReply(
  commentId: string,
  actorId: string,
  actorName: string,
  actorEmail: string,
  spreadsheetId: string,
  cellRef: string,
  replyText: string,
): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      replies: { select: { authorId: true } },
    },
  });

  if (!comment) return;

  // Collect unique participant IDs (comment author + reply authors)
  const participantIds = new Set<string>();
  participantIds.add(comment.authorId);
  for (const reply of comment.replies) {
    participantIds.add(reply.authorId);
  }

  // Don't notify the actor themselves
  participantIds.delete(actorId);

  for (const userId of participantIds) {
    await createNotification(
      userId,
      "comment_reply",
      "New reply to a comment",
      `${actorName} replied: "${replyText.slice(0, 100)}"`,
      {
        spreadsheetId,
        cellRef,
        fromUserId: actorId,
        fromUserName: actorName,
        fromUserEmail: actorEmail,
      },
    );
  }
}
