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
    spreadsheetId: "spreadsheet-1",
    triggerType: "any_changes",
    specificEmail: null,
    frequency: "immediately",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it("has correct initial state", () => {
    const state = useNotificationRuleStore.getState();
    expect(state.rules).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it("addRule prepends a rule", () => {
    const rule1 = makeRule({ id: "rule-1" });
    const rule2 = makeRule({ id: "rule-2" });

    useNotificationRuleStore.getState().addRule(rule1);
    useNotificationRuleStore.getState().addRule(rule2);

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toHaveLength(2);
    expect(state.rules[0].id).toBe("rule-2");
    expect(state.rules[1].id).toBe("rule-1");
  });

  it("setRules replaces the full list", () => {
    const rules = [
      makeRule({ id: "rule-1" }),
      makeRule({
        id: "rule-2",
        triggerType: "specific_user",
        specificEmail: "test@example.com",
      }),
    ];

    useNotificationRuleStore.getState().setRules(rules);

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toHaveLength(2);
    expect(state.rules[1].triggerType).toBe("specific_user");
    expect(state.rules[1].specificEmail).toBe("test@example.com");
  });

  it("updateRule updates a specific rule", () => {
    const rule = makeRule({ id: "rule-update", isActive: true });
    useNotificationRuleStore.getState().addRule(rule);

    useNotificationRuleStore.getState().updateRule("rule-update", {
      isActive: false,
      frequency: "daily_digest",
    });

    const updated = useNotificationRuleStore.getState().rules[0];
    expect(updated.isActive).toBe(false);
    expect(updated.frequency).toBe("daily_digest");
  });

  it("updateRule ignores non-existent rule", () => {
    const rule = makeRule({ id: "rule-exists" });
    useNotificationRuleStore.getState().addRule(rule);

    useNotificationRuleStore.getState().updateRule("non-existent", {
      isActive: false,
    });

    expect(useNotificationRuleStore.getState().rules[0].isActive).toBe(true);
  });

  it("removeRule removes a rule by id", () => {
    const rule = makeRule({ id: "rule-del" });
    useNotificationRuleStore.getState().addRule(rule);
    expect(useNotificationRuleStore.getState().rules).toHaveLength(1);

    useNotificationRuleStore.getState().removeRule("rule-del");
    expect(useNotificationRuleStore.getState().rules).toHaveLength(0);
  });

  it("setLoading toggles loading state", () => {
    useNotificationRuleStore.getState().setLoading(true);
    expect(useNotificationRuleStore.getState().isLoading).toBe(true);

    useNotificationRuleStore.getState().setLoading(false);
    expect(useNotificationRuleStore.getState().isLoading).toBe(false);
  });

  it("clear resets all state", () => {
    useNotificationRuleStore.getState().addRule(makeRule());
    useNotificationRuleStore.getState().setLoading(true);

    useNotificationRuleStore.getState().clear();

    const state = useNotificationRuleStore.getState();
    expect(state.rules).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it("supports all trigger types", () => {
    useNotificationRuleStore
      .getState()
      .addRule(makeRule({ id: "r1", triggerType: "any_changes" }));
    useNotificationRuleStore
      .getState()
      .addRule(makeRule({ id: "r2", triggerType: "form_submit" }));
    useNotificationRuleStore.getState().addRule(
      makeRule({
        id: "r3",
        triggerType: "specific_user",
        specificEmail: "user@test.com",
      }),
    );

    const rules = useNotificationRuleStore.getState().rules;
    expect(rules).toHaveLength(3);
    expect(rules[0].triggerType).toBe("specific_user");
    expect(rules[0].specificEmail).toBe("user@test.com");
    expect(rules[1].triggerType).toBe("form_submit");
    expect(rules[2].triggerType).toBe("any_changes");
  });

  it("supports both frequency types", () => {
    useNotificationRuleStore
      .getState()
      .addRule(makeRule({ id: "r-imm", frequency: "immediately" }));
    useNotificationRuleStore
      .getState()
      .addRule(makeRule({ id: "r-dig", frequency: "daily_digest" }));

    const rules = useNotificationRuleStore.getState().rules;
    expect(rules[0].frequency).toBe("daily_digest");
    expect(rules[1].frequency).toBe("immediately");
  });
});
