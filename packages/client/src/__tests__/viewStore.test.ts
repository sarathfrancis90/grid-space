import { describe, it, expect, beforeEach } from "vitest";
import { useViewStore } from "../stores/viewStore";

describe("viewStore", () => {
  beforeEach(() => {
    useViewStore.setState({
      activeView: "grid",
      kanbanConfig: null,
      timelineConfig: null,
      calendarConfig: null,
    });
  });

  it("defaults to grid view", () => {
    expect(useViewStore.getState().activeView).toBe("grid");
  });

  it("switches active view", () => {
    useViewStore.getState().setActiveView("kanban");
    expect(useViewStore.getState().activeView).toBe("kanban");
  });

  it("switches between all view types", () => {
    const { setActiveView } = useViewStore.getState();

    setActiveView("kanban");
    expect(useViewStore.getState().activeView).toBe("kanban");

    setActiveView("timeline");
    expect(useViewStore.getState().activeView).toBe("timeline");

    setActiveView("calendar");
    expect(useViewStore.getState().activeView).toBe("calendar");

    setActiveView("grid");
    expect(useViewStore.getState().activeView).toBe("grid");
  });

  it("sets kanban config", () => {
    useViewStore.getState().setKanbanConfig({
      statusCol: 0,
      titleCol: 1,
      descCol: 2,
      colorCol: null,
    });
    const config = useViewStore.getState().kanbanConfig;
    expect(config).toEqual({
      statusCol: 0,
      titleCol: 1,
      descCol: 2,
      colorCol: null,
    });
  });

  it("sets timeline config", () => {
    useViewStore.getState().setTimelineConfig({
      startDateCol: 0,
      endDateCol: 2,
      titleCol: 1,
      colorCol: null,
    });
    const config = useViewStore.getState().timelineConfig;
    expect(config).toEqual({
      startDateCol: 0,
      endDateCol: 2,
      titleCol: 1,
      colorCol: null,
    });
  });

  it("sets calendar config", () => {
    useViewStore.getState().setCalendarConfig({
      dateCol: 0,
      titleCol: 1,
      colorCol: null,
    });
    const config = useViewStore.getState().calendarConfig;
    expect(config).toEqual({
      dateCol: 0,
      titleCol: 1,
      colorCol: null,
    });
  });

  it("resets all configs", () => {
    useViewStore.getState().setKanbanConfig({
      statusCol: 0,
      titleCol: 1,
      descCol: null,
      colorCol: null,
    });
    useViewStore.getState().setTimelineConfig({
      startDateCol: 0,
      endDateCol: null,
      titleCol: 1,
      colorCol: null,
    });
    useViewStore.getState().setCalendarConfig({
      dateCol: 0,
      titleCol: 1,
      colorCol: null,
    });

    useViewStore.getState().resetConfigs();

    expect(useViewStore.getState().kanbanConfig).toBeNull();
    expect(useViewStore.getState().timelineConfig).toBeNull();
    expect(useViewStore.getState().calendarConfig).toBeNull();
  });

  it("preserves configs when switching views", () => {
    useViewStore.getState().setKanbanConfig({
      statusCol: 0,
      titleCol: 1,
      descCol: null,
      colorCol: null,
    });

    useViewStore.getState().setActiveView("timeline");
    expect(useViewStore.getState().kanbanConfig).not.toBeNull();

    useViewStore.getState().setActiveView("kanban");
    expect(useViewStore.getState().kanbanConfig).toEqual({
      statusCol: 0,
      titleCol: 1,
      descCol: null,
      colorCol: null,
    });
  });

  it("allows switching view without config (auto-assign handles it)", () => {
    // Switching to kanban without config should work — view components
    // auto-assign defaults rather than blocking with a modal
    useViewStore.getState().setActiveView("kanban");
    expect(useViewStore.getState().activeView).toBe("kanban");
    expect(useViewStore.getState().kanbanConfig).toBeNull();
  });
});
