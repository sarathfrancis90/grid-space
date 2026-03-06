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

  it("starts with grid as active view", () => {
    expect(useViewStore.getState().activeView).toBe("grid");
  });

  it("switches to kanban view", () => {
    useViewStore.getState().setActiveView("kanban");
    expect(useViewStore.getState().activeView).toBe("kanban");
  });

  it("switches to timeline view", () => {
    useViewStore.getState().setActiveView("timeline");
    expect(useViewStore.getState().activeView).toBe("timeline");
  });

  it("switches to calendar view", () => {
    useViewStore.getState().setActiveView("calendar");
    expect(useViewStore.getState().activeView).toBe("calendar");
  });

  it("switches back to grid from kanban", () => {
    useViewStore.getState().setActiveView("kanban");
    useViewStore.getState().setActiveView("grid");
    expect(useViewStore.getState().activeView).toBe("grid");
  });

  it("can switch between non-grid views", () => {
    useViewStore.getState().setActiveView("kanban");
    useViewStore.getState().setActiveView("timeline");
    expect(useViewStore.getState().activeView).toBe("timeline");
    useViewStore.getState().setActiveView("calendar");
    expect(useViewStore.getState().activeView).toBe("calendar");
  });

  it("sets kanban config", () => {
    const config = { statusCol: 0, titleCol: 1, descCol: 2, colorCol: null };
    useViewStore.getState().setKanbanConfig(config);
    expect(useViewStore.getState().kanbanConfig).toEqual(config);
  });

  it("sets timeline config", () => {
    const config = {
      startDateCol: 0,
      endDateCol: 1,
      titleCol: 2,
      colorCol: null,
    };
    useViewStore.getState().setTimelineConfig(config);
    expect(useViewStore.getState().timelineConfig).toEqual(config);
  });

  it("sets calendar config", () => {
    const config = { dateCol: 0, titleCol: 1, colorCol: null };
    useViewStore.getState().setCalendarConfig(config);
    expect(useViewStore.getState().calendarConfig).toEqual(config);
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

    const state = useViewStore.getState();
    expect(state.kanbanConfig).toBeNull();
    expect(state.timelineConfig).toBeNull();
    expect(state.calendarConfig).toBeNull();
  });

  it("preserves config when switching views", () => {
    const kanbanConfig = {
      statusCol: 0,
      titleCol: 1,
      descCol: null,
      colorCol: null,
    };
    useViewStore.getState().setKanbanConfig(kanbanConfig);
    useViewStore.getState().setActiveView("timeline");
    expect(useViewStore.getState().kanbanConfig).toEqual(kanbanConfig);
    useViewStore.getState().setActiveView("kanban");
    expect(useViewStore.getState().kanbanConfig).toEqual(kanbanConfig);
  });
});
