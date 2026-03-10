/**
 * NotificationRule store — manages per-spreadsheet notification rules.
 * Rules control when a user receives email notifications about changes.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type TriggerType =
  | "any_changes"
  | "user_submits_form"
  | "specific_user_changes";

export type RuleFrequency = "immediately" | "daily_digest";

export interface NotificationRule {
  id: string;
  userId: string;
  spreadsheetId: string;
  triggerType: TriggerType;
  triggerEmail: string | null;
  frequency: RuleFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationRuleState {
  rules: NotificationRule[];
  isLoading: boolean;

  setRules: (rules: NotificationRule[]) => void;
  addRule: (rule: NotificationRule) => void;
  updateRule: (id: string, updates: Partial<NotificationRule>) => void;
  removeRule: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useNotificationRuleStore = create<NotificationRuleState>()(
  immer((set) => ({
    rules: [],
    isLoading: false,

    setRules: (rules) => {
      set((state) => {
        state.rules = rules;
        state.isLoading = false;
      });
    },

    addRule: (rule) => {
      set((state) => {
        state.rules.unshift(rule);
      });
    },

    updateRule: (id, updates) => {
      set((state) => {
        const rule = state.rules.find((r) => r.id === id);
        if (rule) {
          Object.assign(rule, updates);
        }
      });
    },

    removeRule: (id) => {
      set((state) => {
        state.rules = state.rules.filter((r) => r.id !== id);
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    clear: () => {
      set((state) => {
        state.rules = [];
        state.isLoading = false;
      });
    },
  })),
);
