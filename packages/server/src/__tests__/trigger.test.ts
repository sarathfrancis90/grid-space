import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("../models/prisma", () => {
  const mockPrisma = {
    trigger: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    triggerLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    spreadsheet: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { default: mockPrisma };
});

vi.mock("../utils/logger", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import prisma from "../models/prisma";
import * as triggerService from "../services/trigger.service";

const mockPrisma = prisma as unknown as {
  trigger: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  triggerLog: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  spreadsheet: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function mockSpreadsheetOwner(userId: string) {
  mockPrisma.spreadsheet.findUnique.mockResolvedValue({
    ownerId: userId,
    access: [],
  });
}

describe("trigger.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listTriggers", () => {
    it("returns triggers for a spreadsheet owner", async () => {
      mockSpreadsheetOwner("user-1");
      const triggers = [
        {
          id: "trig-1",
          macroId: "macro-1",
          eventType: "onEdit",
          isEnabled: true,
          intervalMinutes: null,
          lastFiredAt: null,
          nextFireAt: null,
          spreadsheetId: "ss-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.trigger.findMany.mockResolvedValue(triggers);

      const result = await triggerService.listTriggers("user-1", "ss-1");
      expect(result).toEqual(triggers);
      expect(mockPrisma.trigger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { spreadsheetId: "ss-1", userId: "user-1" },
        }),
      );
    });

    it("throws NotFoundError for missing spreadsheet", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue(null);

      await expect(
        triggerService.listTriggers("user-1", "missing"),
      ).rejects.toThrow("Spreadsheet not found");
    });

    it("throws ForbiddenError for viewer", async () => {
      mockPrisma.spreadsheet.findUnique.mockResolvedValue({
        ownerId: "other-user",
        access: [{ role: "viewer" }],
      });

      await expect(
        triggerService.listTriggers("user-1", "ss-1"),
      ).rejects.toThrow("editor access");
    });
  });

  describe("createTrigger", () => {
    it("creates an onEdit trigger", async () => {
      mockSpreadsheetOwner("user-1");
      mockPrisma.trigger.count.mockResolvedValue(0);
      mockPrisma.trigger.create.mockResolvedValue({
        id: "trig-new",
        macroId: "macro-1",
        eventType: "onEdit",
        isEnabled: true,
        intervalMinutes: null,
        lastFiredAt: null,
        nextFireAt: null,
        spreadsheetId: "ss-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await triggerService.createTrigger(
        "user-1",
        "ss-1",
        "macro-1",
        "onEdit",
      );

      expect(result.id).toBe("trig-new");
      expect(result.eventType).toBe("onEdit");
      expect(mockPrisma.trigger.create).toHaveBeenCalled();
    });

    it("creates a timeBased trigger with interval", async () => {
      mockSpreadsheetOwner("user-1");
      mockPrisma.trigger.count.mockResolvedValue(0);
      mockPrisma.trigger.create.mockResolvedValue({
        id: "trig-time",
        macroId: "macro-1",
        eventType: "timeBased",
        isEnabled: true,
        intervalMinutes: 60,
        lastFiredAt: null,
        nextFireAt: new Date(),
        spreadsheetId: "ss-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await triggerService.createTrigger(
        "user-1",
        "ss-1",
        "macro-1",
        "timeBased",
        60,
      );

      expect(result.eventType).toBe("timeBased");
      expect(result.intervalMinutes).toBe(60);
    });

    it("rejects invalid event type", async () => {
      await expect(
        triggerService.createTrigger("user-1", "ss-1", "macro-1", "invalid"),
      ).rejects.toThrow("Invalid event type");
    });

    it("rejects timeBased without interval", async () => {
      await expect(
        triggerService.createTrigger("user-1", "ss-1", "macro-1", "timeBased"),
      ).rejects.toThrow("intervalMinutes is required");
    });

    it("rejects invalid interval", async () => {
      await expect(
        triggerService.createTrigger(
          "user-1",
          "ss-1",
          "macro-1",
          "timeBased",
          7,
        ),
      ).rejects.toThrow("Invalid interval");
    });

    it("rejects when trigger limit is reached", async () => {
      mockSpreadsheetOwner("user-1");
      mockPrisma.trigger.count.mockResolvedValue(20);

      await expect(
        triggerService.createTrigger("user-1", "ss-1", "macro-1", "onEdit"),
      ).rejects.toThrow("Maximum of 20 triggers");
    });
  });

  describe("updateTrigger", () => {
    it("toggles isEnabled", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue({
        userId: "user-1",
        eventType: "onEdit",
      });
      mockPrisma.trigger.update.mockResolvedValue({
        id: "trig-1",
        isEnabled: false,
      });

      const result = await triggerService.updateTrigger("user-1", "trig-1", {
        isEnabled: false,
      });
      expect(result.isEnabled).toBe(false);
    });

    it("rejects intervalMinutes on non-timeBased trigger", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue({
        userId: "user-1",
        eventType: "onEdit",
      });

      await expect(
        triggerService.updateTrigger("user-1", "trig-1", {
          intervalMinutes: 60,
        }),
      ).rejects.toThrow("only applies to timeBased");
    });

    it("throws NotFoundError for missing trigger", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue(null);

      await expect(
        triggerService.updateTrigger("user-1", "missing", { isEnabled: false }),
      ).rejects.toThrow("Trigger not found");
    });

    it("throws ForbiddenError for wrong user", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue({
        userId: "other-user",
        eventType: "onEdit",
      });

      await expect(
        triggerService.updateTrigger("user-1", "trig-1", { isEnabled: false }),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("deleteTrigger", () => {
    it("deletes trigger for the correct user", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      mockPrisma.trigger.delete.mockResolvedValue({});

      await triggerService.deleteTrigger("user-1", "trig-1");
      expect(mockPrisma.trigger.delete).toHaveBeenCalledWith({
        where: { id: "trig-1" },
      });
    });

    it("throws for wrong user", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue({
        userId: "other-user",
      });

      await expect(
        triggerService.deleteTrigger("user-1", "trig-1"),
      ).rejects.toThrow("Access denied");
    });
  });

  describe("getTriggerLogs", () => {
    it("returns paginated logs", async () => {
      mockPrisma.trigger.findUnique.mockResolvedValue({
        userId: "user-1",
      });
      const logs = [
        {
          id: "log-1",
          triggerId: "trig-1",
          status: "success",
          message: "Trigger fired",
          durationMs: 50,
          eventPayload: {},
          createdAt: new Date(),
        },
      ];
      mockPrisma.triggerLog.findMany.mockResolvedValue(logs);
      mockPrisma.triggerLog.count.mockResolvedValue(1);

      const result = await triggerService.getTriggerLogs(
        "user-1",
        "trig-1",
        1,
        20,
      );
      expect(result.logs).toEqual(logs);
      expect(result.total).toBe(1);
    });
  });

  describe("fireTriggers", () => {
    it("fires enabled triggers for a spreadsheet event", async () => {
      mockPrisma.trigger.findMany.mockResolvedValue([
        {
          id: "trig-1",
          macroId: "macro-1",
          lastFiredAt: null,
        },
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await triggerService.fireTriggers("ss-1", "onEdit", {
        cell: "A1",
        value: "test",
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("skips rate-limited triggers", async () => {
      mockPrisma.trigger.findMany.mockResolvedValue([
        {
          id: "trig-1",
          macroId: "macro-1",
          lastFiredAt: new Date(), // Just fired
        },
      ]);

      await triggerService.fireTriggers("ss-1", "onEdit", { cell: "A1" });

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("fireTimedTriggers", () => {
    it("fires due time-based triggers and schedules next", async () => {
      mockPrisma.trigger.findMany.mockResolvedValue([
        {
          id: "trig-1",
          macroId: "macro-1",
          spreadsheetId: "ss-1",
          intervalMinutes: 60,
          userId: "user-1",
        },
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await triggerService.fireTimedTriggers();

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
