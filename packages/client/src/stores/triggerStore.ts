import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type TriggerEventType = "onEdit" | "onOpen" | "onChange" | "timeBased";

export interface TriggerDefinition {
  id: string;
  macroId: string;
  eventType: TriggerEventType;
  isEnabled: boolean;
  intervalMinutes: number | null;
  lastFiredAt: string | null;
  nextFireAt: string | null;
  spreadsheetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerLogEntry {
  id: string;
  triggerId: string;
  status: "success" | "error";
  message: string | null;
  durationMs: number | null;
  eventPayload: Record<string, unknown> | null;
  createdAt: string;
}

interface TriggerState {
  triggers: TriggerDefinition[];
  logs: TriggerLogEntry[];
  logsTotal: number;
  isLoading: boolean;
  selectedTriggerId: string | null;

  setTriggers: (triggers: TriggerDefinition[]) => void;
  addTrigger: (trigger: TriggerDefinition) => void;
  updateTrigger: (id: string, updates: Partial<TriggerDefinition>) => void;
  removeTrigger: (id: string) => void;
  setLogs: (logs: TriggerLogEntry[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setSelectedTrigger: (id: string | null) => void;
}

export const useTriggerStore = create<TriggerState>()(
  immer((set) => ({
    triggers: [],
    logs: [],
    logsTotal: 0,
    isLoading: false,
    selectedTriggerId: null,

    setTriggers: (triggers: TriggerDefinition[]) => {
      set((state) => {
        state.triggers = triggers;
      });
    },

    addTrigger: (trigger: TriggerDefinition) => {
      set((state) => {
        state.triggers.unshift(trigger);
      });
    },

    updateTrigger: (id: string, updates: Partial<TriggerDefinition>) => {
      set((state) => {
        const idx = state.triggers.findIndex((t) => t.id === id);
        if (idx >= 0) {
          Object.assign(state.triggers[idx], updates);
        }
      });
    },

    removeTrigger: (id: string) => {
      set((state) => {
        state.triggers = state.triggers.filter((t) => t.id !== id);
        if (state.selectedTriggerId === id) {
          state.selectedTriggerId = null;
        }
      });
    },

    setLogs: (logs: TriggerLogEntry[], total: number) => {
      set((state) => {
        state.logs = logs;
        state.logsTotal = total;
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setSelectedTrigger: (id: string | null) => {
      set((state) => {
        state.selectedTriggerId = id;
      });
    },
  })),
);
