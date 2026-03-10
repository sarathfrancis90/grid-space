import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

export interface NotificationRuleData {
  triggerType: string;
  triggerEmail?: string | null;
  frequency?: string;
}

interface NotificationRuleItem {
  id: string;
  userId: string;
  spreadsheetId: string;
  triggerType: string;
  triggerEmail: string | null;
  frequency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Verify user has access to the spreadsheet */
async function verifyAccess(
  userId: string,
  spreadsheetId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: { where: { userId }, select: { id: true } },
    },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  if (spreadsheet.ownerId !== userId && spreadsheet.access.length === 0) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }
}

/** List notification rules for a user on a spreadsheet */
export async function listRules(
  userId: string,
  spreadsheetId: string,
): Promise<NotificationRuleItem[]> {
  await verifyAccess(userId, spreadsheetId);

  return prisma.notificationRule.findMany({
    where: { userId, spreadsheetId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new notification rule */
export async function createRule(
  userId: string,
  spreadsheetId: string,
  data: NotificationRuleData,
): Promise<NotificationRuleItem> {
  await verifyAccess(userId, spreadsheetId);

  const rule = await prisma.notificationRule.create({
    data: {
      userId,
      spreadsheetId,
      triggerType: data.triggerType,
      triggerEmail: data.triggerEmail ?? null,
      frequency: data.frequency ?? "immediately",
    },
  });

  logger.info(
    { userId, spreadsheetId, ruleId: rule.id },
    "Notification rule created",
  );

  return rule;
}

/** Update an existing notification rule */
export async function updateRule(
  userId: string,
  ruleId: string,
  data: Partial<NotificationRuleData> & { isActive?: boolean },
): Promise<NotificationRuleItem> {
  const rule = await prisma.notificationRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule || rule.userId !== userId) {
    throw new NotFoundError("Notification rule not found");
  }

  return prisma.notificationRule.update({
    where: { id: ruleId },
    data: {
      ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
      ...(data.triggerEmail !== undefined && {
        triggerEmail: data.triggerEmail ?? null,
      }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/** Delete a notification rule */
export async function deleteRule(
  userId: string,
  ruleId: string,
): Promise<void> {
  const rule = await prisma.notificationRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule || rule.userId !== userId) {
    throw new NotFoundError("Notification rule not found");
  }

  await prisma.notificationRule.delete({ where: { id: ruleId } });

  logger.info({ userId, ruleId }, "Notification rule deleted");
}
