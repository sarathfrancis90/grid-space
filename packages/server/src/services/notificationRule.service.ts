import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

export type TriggerType = "any_changes" | "form_submit" | "specific_user";
export type Frequency = "immediately" | "daily_digest";

interface NotificationRuleItem {
  id: string;
  userId: string;
  spreadsheetId: string;
  triggerType: string;
  specificEmail: string | null;
  frequency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRuleInput {
  spreadsheetId: string;
  triggerType: TriggerType;
  specificEmail?: string;
  frequency?: Frequency;
}

interface UpdateRuleInput {
  triggerType?: TriggerType;
  specificEmail?: string | null;
  frequency?: Frequency;
  isActive?: boolean;
}

/** List notification rules for a user on a specific spreadsheet */
export async function listRules(
  userId: string,
  spreadsheetId: string,
): Promise<NotificationRuleItem[]> {
  return prisma.notificationRule.findMany({
    where: { userId, spreadsheetId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new notification rule */
export async function createRule(
  userId: string,
  input: CreateRuleInput,
): Promise<NotificationRuleItem> {
  // Verify user has access to the spreadsheet
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: input.spreadsheetId },
    select: {
      id: true,
      ownerId: true,
      access: { select: { userId: true } },
    },
  });

  if (!spreadsheet) {
    throw new NotFoundError("Spreadsheet not found");
  }

  const hasAccess =
    spreadsheet.ownerId === userId ||
    spreadsheet.access.some((a) => a.userId === userId);

  if (!hasAccess) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }

  const rule = await prisma.notificationRule.create({
    data: {
      userId,
      spreadsheetId: input.spreadsheetId,
      triggerType: input.triggerType,
      specificEmail: input.specificEmail ?? null,
      frequency: input.frequency ?? "immediately",
    },
  });

  logger.info(
    { userId, spreadsheetId: input.spreadsheetId, ruleId: rule.id },
    "Notification rule created",
  );

  return rule;
}

/** Update an existing notification rule */
export async function updateRule(
  userId: string,
  ruleId: string,
  input: UpdateRuleInput,
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
      ...(input.triggerType !== undefined && {
        triggerType: input.triggerType,
      }),
      ...(input.specificEmail !== undefined && {
        specificEmail: input.specificEmail,
      }),
      ...(input.frequency !== undefined && { frequency: input.frequency }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
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
