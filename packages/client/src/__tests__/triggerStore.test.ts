import { describe, it, expect, beforeEach } from "vitest";
import { useTriggerStore } from "../stores/triggerStore";
import type {
  TriggerDefinition,
  TriggerLogEntry,
} from "../stores/triggerStore";

function makeTrigger(
  overrides?: Partial<TriggerDefinition>,
): TriggerDefinition {
  return {
    id: "trig-1",
    macroId: "macro-1",
    eventType: "onEdit",
    isEnabled: true,
    intervalMinutes: null,
    lastFiredAt: null,
    nextFireAt: null,
    spreadsheetId: "ss-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeLog(overrides?: Partial<TriggerLogEntry>): TriggerLogEntry {
  return {
    id: "log-1",
    triggerId: "trig-1",
    status: "success",
    message: "Trigger fired",
    durationMs: 50,
    eventPayload: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("triggerStore", () => {
  beforeEach(() => {
    useTriggerStore.setState({
      triggers: [],
      logs: [],
      logsTotal: 0,
      isLoading: false,
      selectedTriggerId: null,
    });
  });

  it("has correct initial state", () => {
    const state = useTriggerStore.getState();
    expect(state.triggers).toEqual([]);
    expect(state.logs).toEqual([]);
    expect(state.logsTotal).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.selectedTriggerId).toBeNull();
  });

  describe("setTriggers", () => {
    it("replaces the trigger list", () => {
      const triggers = [makeTrigger(), makeTrigger({ id: "trig-2" })];
      useTriggerStore.getState().setTriggers(triggers);
      expect(useTriggerStore.getState().triggers).toHaveLength(2);
    });
  });

  describe("addTrigger", () => {
    it("adds a trigger to the beginning of the list", () => {
      useTriggerStore.getState().setTriggers([makeTrigger({ id: "trig-old" })]);
      useTriggerStore.getState().addTrigger(makeTrigger({ id: "trig-new" }));

      const triggers = useTriggerStore.getState().triggers;
      expect(triggers).toHaveLength(2);
      expect(triggers[0].id).toBe("trig-new");
    });
  });

  describe("updateTrigger", () => {
    it("updates trigger properties", () => {
      useTriggerStore.getState().setTriggers([makeTrigger()]);
      useTriggerStore.getState().updateTrigger("trig-1", { isEnabled: false });

      expect(useTriggerStore.getState().triggers[0].isEnabled).toBe(false);
    });

    it("does nothing for unknown id", () => {
      useTriggerStore.getState().setTriggers([makeTrigger()]);
      useTriggerStore.getState().updateTrigger("unknown", { isEnabled: false });

      expect(useTriggerStore.getState().triggers[0].isEnabled).toBe(true);
    });
  });

  describe("removeTrigger", () => {
    it("removes a trigger by id", () => {
      useTriggerStore
        .getState()
        .setTriggers([makeTrigger(), makeTrigger({ id: "trig-2" })]);
      useTriggerStore.getState().removeTrigger("trig-1");

      const triggers = useTriggerStore.getState().triggers;
      expect(triggers).toHaveLength(1);
      expect(triggers[0].id).toBe("trig-2");
    });

    it("clears selectedTriggerId when removed trigger was selected", () => {
      useTriggerStore.getState().setTriggers([makeTrigger()]);
      useTriggerStore.getState().setSelectedTrigger("trig-1");
      useTriggerStore.getState().removeTrigger("trig-1");

      expect(useTriggerStore.getState().selectedTriggerId).toBeNull();
    });
  });

  describe("setLogs", () => {
    it("sets logs and total", () => {
      const logs = [makeLog(), makeLog({ id: "log-2" })];
      useTriggerStore.getState().setLogs(logs, 10);

      expect(useTriggerStore.getState().logs).toHaveLength(2);
      expect(useTriggerStore.getState().logsTotal).toBe(10);
    });
  });

  describe("setLoading", () => {
    it("sets loading state", () => {
      useTriggerStore.getState().setLoading(true);
      expect(useTriggerStore.getState().isLoading).toBe(true);
      useTriggerStore.getState().setLoading(false);
      expect(useTriggerStore.getState().isLoading).toBe(false);
    });
  });

  describe("setSelectedTrigger", () => {
    it("sets selected trigger id", () => {
      useTriggerStore.getState().setSelectedTrigger("trig-1");
      expect(useTriggerStore.getState().selectedTriggerId).toBe("trig-1");
    });

    it("clears selection with null", () => {
      useTriggerStore.getState().setSelectedTrigger("trig-1");
      useTriggerStore.getState().setSelectedTrigger(null);
      expect(useTriggerStore.getState().selectedTriggerId).toBeNull();
    });
  });
});
