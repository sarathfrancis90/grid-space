import prisma from "../models/prisma";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../utils/AppError";
import logger from "../utils/logger";

const VALID_EVENT_TYPES = [
  "onEdit",
  "onOpen",
  "onChange",
  "timeBased",
] as const;
type EventType = (typeof VALID_EVENT_TYPES)[number];

const VALID_INTERVALS = [1, 5, 15, 30, 60, 360, 720, 1440] as const;

const MAX_TRIGGERS_PER_SPREADSHEET = 20;
const RATE_LIMIT_MS = 1000; // Min 1 second between trigger fires

interface TriggerRecord {
  id: string;
  macroId: string;
  eventType: string;
  isEnabled: boolean;
  intervalMinutes: number | null;
  lastFiredAt: Date | null;
  nextFireAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  spreadsheetId: string;
}

interface TriggerLogRecord {
  id: string;
  triggerId: string;
  status: string;
  message: string | null;
  durationMs: number | null;
  eventPayload: unknown;
  createdAt: Date;
}

const TRIGGER_SELECT = {
  id: true,
  macroId: true,
  eventType: true,
  isEnabled: true,
  intervalMinutes: true,
  lastFiredAt: true,
  nextFireAt: true,
  createdAt: true,
  updatedAt: true,
  spreadsheetId: true,
};

const LOG_SELECT = {
  id: true,
  triggerId: true,
  status: true,
  message: true,
  durationMs: true,
  eventPayload: true,
  createdAt: true,
};

function computeNextFireAt(intervalMinutes: number): Date {
  return new Date(Date.now() + intervalMinutes * 60 * 1000);
}

/** List all triggers for a spreadsheet */
export async function listTriggers(
  userId: string,
  spreadsheetId: string,
): Promise<TriggerRecord[]> {
  await verifyOwnerOrEditor(userId, spreadsheetId);

  return prisma.trigger.findMany({
    where: { spreadsheetId, userId },
    select: TRIGGER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new trigger */
export async function createTrigger(
  userId: string,
  spreadsheetId: string,
  macroId: string,
  eventType: string,
  intervalMinutes?: number,
): Promise<TriggerRecord> {
  if (!VALID_EVENT_TYPES.includes(eventType as EventType)) {
    throw new ValidationError(
      `Invalid event type: ${eventType}. Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
    );
  }

  if (eventType === "timeBased") {
    if (!intervalMinutes) {
      throw new ValidationError(
        "intervalMinutes is required for timeBased triggers",
      );
    }
    if (
      !VALID_INTERVALS.includes(
        intervalMinutes as (typeof VALID_INTERVALS)[number],
      )
    ) {
      throw new ValidationError(
        `Invalid interval: ${intervalMinutes}. Must be one of: ${VALID_INTERVALS.join(", ")}`,
      );
    }
  }

  await verifyOwnerOrEditor(userId, spreadsheetId);

  // Check trigger limit
  const count = await prisma.trigger.count({
    where: { spreadsheetId, userId },
  });
  if (count >= MAX_TRIGGERS_PER_SPREADSHEET) {
    throw new ValidationError(
      `Maximum of ${MAX_TRIGGERS_PER_SPREADSHEET} triggers per spreadsheet`,
    );
  }

  const nextFireAt =
    eventType === "timeBased" && intervalMinutes
      ? computeNextFireAt(intervalMinutes)
      : null;

  const trigger = await prisma.trigger.create({
    data: {
      userId,
      spreadsheetId,
      macroId,
      eventType,
      intervalMinutes: eventType === "timeBased" ? intervalMinutes : null,
      nextFireAt,
    },
    select: TRIGGER_SELECT,
  });

  logger.info(
    { userId, spreadsheetId, triggerId: trigger.id, eventType },
    "Trigger created",
  );

  return trigger;
}

/** Update a trigger (enable/disable, change interval) */
export async function updateTrigger(
  userId: string,
  triggerId: string,
  updates: { isEnabled?: boolean; intervalMinutes?: number },
): Promise<TriggerRecord> {
  const trigger = await prisma.trigger.findUnique({
    where: { id: triggerId },
    select: { userId: true, eventType: true },
  });

  if (!trigger) throw new NotFoundError("Trigger not found");
  if (trigger.userId !== userId) throw new ForbiddenError("Access denied");

  const data: Record<string, unknown> = {};

  if (updates.isEnabled !== undefined) {
    data.isEnabled = updates.isEnabled;
  }

  if (updates.intervalMinutes !== undefined) {
    if (trigger.eventType !== "timeBased") {
      throw new ValidationError(
        "intervalMinutes only applies to timeBased triggers",
      );
    }
    if (
      !VALID_INTERVALS.includes(
        updates.intervalMinutes as (typeof VALID_INTERVALS)[number],
      )
    ) {
      throw new ValidationError(
        `Invalid interval: ${updates.intervalMinutes}. Must be one of: ${VALID_INTERVALS.join(", ")}`,
      );
    }
    data.intervalMinutes = updates.intervalMinutes;
    data.nextFireAt = computeNextFireAt(updates.intervalMinutes);
  }

  return prisma.trigger.update({
    where: { id: triggerId },
    data,
    select: TRIGGER_SELECT,
  });
}

/** Delete a trigger */
export async function deleteTrigger(
  userId: string,
  triggerId: string,
): Promise<void> {
  const trigger = await prisma.trigger.findUnique({
    where: { id: triggerId },
    select: { userId: true },
  });

  if (!trigger) throw new NotFoundError("Trigger not found");
  if (trigger.userId !== userId) throw new ForbiddenError("Access denied");

  await prisma.trigger.delete({ where: { id: triggerId } });

  logger.info({ userId, triggerId }, "Trigger deleted");
}

/** Get trigger execution logs */
export async function getTriggerLogs(
  userId: string,
  triggerId: string,
  page: number,
  limit: number,
): Promise<{ logs: TriggerLogRecord[]; total: number }> {
  const trigger = await prisma.trigger.findUnique({
    where: { id: triggerId },
    select: { userId: true },
  });

  if (!trigger) throw new NotFoundError("Trigger not found");
  if (trigger.userId !== userId) throw new ForbiddenError("Access denied");

  const [logs, total] = await Promise.all([
    prisma.triggerLog.findMany({
      where: { triggerId },
      select: LOG_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.triggerLog.count({ where: { triggerId } }),
  ]);

  return { logs, total };
}

/** Fire triggers for a given event type on a spreadsheet */
export async function fireTriggers(
  spreadsheetId: string,
  eventType: string,
  eventPayload: Record<string, unknown>,
): Promise<void> {
  const triggers = await prisma.trigger.findMany({
    where: {
      spreadsheetId,
      eventType,
      isEnabled: true,
    },
    select: {
      id: true,
      macroId: true,
      lastFiredAt: true,
    },
  });

  for (const trigger of triggers) {
    // Rate limit: don't fire more than once per second
    if (
      trigger.lastFiredAt &&
      Date.now() - trigger.lastFiredAt.getTime() < RATE_LIMIT_MS
    ) {
      continue;
    }

    const startTime = Date.now();
    try {
      // Log the trigger execution (macro replay is client-side)
      await prisma.$transaction([
        prisma.trigger.update({
          where: { id: trigger.id },
          data: { lastFiredAt: new Date() },
        }),
        prisma.triggerLog.create({
          data: {
            triggerId: trigger.id,
            status: "success",
            message: `Trigger fired for ${eventType}`,
            durationMs: Date.now() - startTime,
            eventPayload: eventPayload as object,
          },
        }),
      ]);

      logger.debug(
        { triggerId: trigger.id, eventType, spreadsheetId },
        "Trigger fired",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.triggerLog.create({
        data: {
          triggerId: trigger.id,
          status: "error",
          message,
          durationMs: Date.now() - startTime,
          eventPayload: eventPayload as object,
        },
      });
      logger.error(
        { triggerId: trigger.id, eventType, error: message },
        "Trigger execution failed",
      );
    }
  }
}

/** Fire time-based triggers that are due */
export async function fireTimedTriggers(): Promise<void> {
  const now = new Date();

  const dueTriggers = await prisma.trigger.findMany({
    where: {
      eventType: "timeBased",
      isEnabled: true,
      nextFireAt: { lte: now },
    },
    select: {
      id: true,
      macroId: true,
      spreadsheetId: true,
      intervalMinutes: true,
      userId: true,
    },
  });

  for (const trigger of dueTriggers) {
    const startTime = Date.now();
    try {
      const nextFireAt = trigger.intervalMinutes
        ? computeNextFireAt(trigger.intervalMinutes)
        : null;

      await prisma.$transaction([
        prisma.trigger.update({
          where: { id: trigger.id },
          data: {
            lastFiredAt: now,
            nextFireAt,
          },
        }),
        prisma.triggerLog.create({
          data: {
            triggerId: trigger.id,
            status: "success",
            message: "Time-based trigger fired",
            durationMs: Date.now() - startTime,
            eventPayload: {
              type: "timeBased",
              spreadsheetId: trigger.spreadsheetId,
              macroId: trigger.macroId,
              firedAt: now.toISOString(),
            },
          },
        }),
      ]);

      logger.debug(
        {
          triggerId: trigger.id,
          spreadsheetId: trigger.spreadsheetId,
          nextFireAt,
        },
        "Time-based trigger fired",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.triggerLog.create({
        data: {
          triggerId: trigger.id,
          status: "error",
          message,
          durationMs: Date.now() - startTime,
        },
      });
      logger.error(
        { triggerId: trigger.id, error: message },
        "Time-based trigger failed",
      );
    }
  }
}

async function verifyOwnerOrEditor(
  userId: string,
  spreadsheetId: string,
): Promise<void> {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    select: {
      ownerId: true,
      access: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!spreadsheet) throw new NotFoundError("Spreadsheet not found");
  if (spreadsheet.ownerId === userId) return;

  const access = spreadsheet.access[0];
  if (!access || access.role === "viewer") {
    throw new ForbiddenError("You need editor access to manage triggers");
  }
}
