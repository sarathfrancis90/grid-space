/**
 * Webhook service — CRUD, HMAC-signed dispatch.
 */
import crypto from "crypto";
import prisma from "../models/prisma";
import { NotFoundError, ForbiddenError } from "../utils/AppError";
import logger from "../utils/logger";

const VALID_EVENTS = [
  "spreadsheet.created",
  "spreadsheet.updated",
  "spreadsheet.deleted",
  "spreadsheet.shared",
  "cell.updated",
  "comment.created",
] as const;

type WebhookEvent = (typeof VALID_EVENTS)[number];

interface WebhookInfo {
  id: string;
  spreadsheetId: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
}

interface CreateWebhookInput {
  spreadsheetId: string;
  url: string;
  events: string[];
}

/** Generate HMAC-SHA256 signature for webhook payload */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/** Generate a random secret for webhook signing */
function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Validate event names */
export function isValidEvent(event: string): event is WebhookEvent {
  return (VALID_EVENTS as readonly string[]).includes(event);
}

/** Get valid event names */
export function getValidEvents(): readonly string[] {
  return VALID_EVENTS;
}

/** Check user has access to spreadsheet */
async function checkSpreadsheetAccess(
  spreadsheetId: string,
  userId: string,
): Promise<void> {
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

  const isOwner = spreadsheet.ownerId === userId;
  const hasAccess = spreadsheet.access.length > 0;

  if (!isOwner && !hasAccess) {
    throw new ForbiddenError("You do not have access to this spreadsheet");
  }
}

/** Create a new webhook */
export async function createWebhook(
  userId: string,
  input: CreateWebhookInput,
): Promise<WebhookInfo & { secret: string }> {
  await checkSpreadsheetAccess(input.spreadsheetId, userId);

  const secret = generateSecret();

  const webhook = await prisma.webhook.create({
    data: {
      userId,
      spreadsheetId: input.spreadsheetId,
      url: input.url,
      secret,
      events: input.events,
    },
    select: {
      id: true,
      spreadsheetId: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggeredAt: true,
      createdAt: true,
    },
  });

  logger.info(
    { userId, webhookId: webhook.id, spreadsheetId: input.spreadsheetId },
    "Webhook created",
  );

  return { ...webhook, secret };
}

/** List webhooks for a user */
export async function listWebhooks(userId: string): Promise<WebhookInfo[]> {
  return prisma.webhook.findMany({
    where: { userId },
    select: {
      id: true,
      spreadsheetId: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggeredAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Delete a webhook */
export async function deleteWebhook(
  webhookId: string,
  userId: string,
): Promise<void> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    select: { userId: true },
  });

  if (!webhook) {
    throw new NotFoundError("Webhook not found");
  }

  if (webhook.userId !== userId) {
    throw new ForbiddenError("You can only delete your own webhooks");
  }

  await prisma.webhook.delete({ where: { id: webhookId } });

  logger.info({ userId, webhookId }, "Webhook deleted");
}

/** Update a webhook */
export async function updateWebhook(
  webhookId: string,
  userId: string,
  data: { url?: string; events?: string[]; isActive?: boolean },
): Promise<WebhookInfo> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    select: { userId: true },
  });

  if (!webhook) {
    throw new NotFoundError("Webhook not found");
  }

  if (webhook.userId !== userId) {
    throw new ForbiddenError("You can only update your own webhooks");
  }

  return prisma.webhook.update({
    where: { id: webhookId },
    data,
    select: {
      id: true,
      spreadsheetId: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggeredAt: true,
      createdAt: true,
    },
  });
}

/** Dispatch webhook for an event — fire-and-forget, non-blocking */
export async function dispatchWebhooks(
  spreadsheetId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      spreadsheetId,
      isActive: true,
      events: { has: event },
    },
    select: {
      id: true,
      url: true,
      secret: true,
    },
  });

  for (const webhook of webhooks) {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const signature = signPayload(body, webhook.secret);

    // Fire-and-forget — don't block the response
    fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10000),
    })
      .then(async () => {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { lastTriggeredAt: new Date() },
        });
      })
      .catch((err: Error) => {
        logger.warn(
          { webhookId: webhook.id, error: err.message },
          "Webhook delivery failed",
        );
      });
  }
}
