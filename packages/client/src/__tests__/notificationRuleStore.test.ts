import { describe, it, expect, beforeEach } from "vitest";
import {
  useNotificationRuleStore,
  type NotificationRule,
} from "../stores/notificationRuleStore";

describe("notificationRuleStore", () => {
  beforeEach(() => {
    useNotificationRuleStore.setState({
      rules: [],
      isLoading: false,
    });
  });

  const makeRule = (
    overrides: Partial<NotificationRule> = {},
  ): NotificationRule => ({
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: "user-1",
    spreadsheetId: "sheet-1",
    triggerType: "any_changes",
    triggerEmail: null,
    frequency: "immediately",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it("should start with empty rules", () => {
    const state = useNotificationRuleStore.getState();
    expect(state.rules).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it("should set rules", () => {
    const rules = [makeRule({ id: "r1" }), makeRule({ id: "r2" })];
    useNotificationRuleStore.getState().setRules(rules);

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toHaveLength(2);
    expect(state.rules[0].id).toBe("r1");
    expect(state.isLoading).toBe(false);
  });

  it("should add a rule to the beginning", () => {
    const existing = makeRule({ id: "r1" });
    useNotificationRuleStore.getState().setRules([existing]);

    const newRule = makeRule({ id: "r2" });
    useNotificationRuleStore.getState().addRule(newRule);

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toHaveLength(2);
    expect(state.rules[0].id).toBe("r2");
  });

  it("should update a rule", () => {
    const rule = makeRule({ id: "r1", frequency: "immediately" });
    useNotificationRuleStore.getState().setRules([rule]);

    useNotificationRuleStore
      .getState()
      .updateRule("r1", { frequency: "daily_digest" });

    const state = useNotificationRuleStore.getState();
    expect(state.rules[0].frequency).toBe("daily_digest");
  });

  it("should not fail when updating a non-existent rule", () => {
    useNotificationRuleStore
      .getState()
      .updateRule("nonexistent", { frequency: "daily_digest" });
    expect(useNotificationRuleStore.getState().rules).toHaveLength(0);
  });

  it("should remove a rule", () => {
    const rules = [makeRule({ id: "r1" }), makeRule({ id: "r2" })];
    useNotificationRuleStore.getState().setRules(rules);

    useNotificationRuleStore.getState().removeRule("r1");

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toHaveLength(1);
    expect(state.rules[0].id).toBe("r2");
  });

  it("should set loading state", () => {
    useNotificationRuleStore.getState().setLoading(true);
    expect(useNotificationRuleStore.getState().isLoading).toBe(true);

    useNotificationRuleStore.getState().setLoading(false);
    expect(useNotificationRuleStore.getState().isLoading).toBe(false);
  });

  it("should clear all rules", () => {
    const rules = [makeRule({ id: "r1" }), makeRule({ id: "r2" })];
    useNotificationRuleStore.getState().setRules(rules);
    useNotificationRuleStore.getState().setLoading(true);

    useNotificationRuleStore.getState().clear();

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toHaveLength(0);
    expect(state.isLoading).toBe(false);
  });

  it("should handle specific_user_changes trigger type", () => {
    const rule = makeRule({
      id: "r1",
      triggerType: "specific_user_changes",
      triggerEmail: "user@example.com",
    });
    useNotificationRuleStore.getState().addRule(rule);

    const state = useNotificationRuleStore.getState();
    expect(state.rules[0].triggerType).toBe("specific_user_changes");
    expect(state.rules[0].triggerEmail).toBe("user@example.com");
  });
});
