import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  ViewType,
  KanbanConfig,
  TimelineConfig,
  CalendarConfig,
} from "../types/views";

interface ViewState {
  activeView: ViewType;
  kanbanConfig: KanbanConfig | null;
  timelineConfig: TimelineConfig | null;
  calendarConfig: CalendarConfig | null;
  setActiveView: (view: ViewType) => void;
  setKanbanConfig: (config: KanbanConfig) => void;
  setTimelineConfig: (config: TimelineConfig) => void;
  setCalendarConfig: (config: CalendarConfig) => void;
  resetConfigs: () => void;
}

export const useViewStore = create<ViewState>()(
  immer((set) => ({
    activeView: "grid",
    kanbanConfig: null,
    timelineConfig: null,
    calendarConfig: null,

    setActiveView: (view: ViewType) => {
      set((state) => {
        state.activeView = view;
      });
    },

    setKanbanConfig: (config: KanbanConfig) => {
      set((state) => {
        state.kanbanConfig = config;
      });
    },

    setTimelineConfig: (config: TimelineConfig) => {
      set((state) => {
        state.timelineConfig = config;
      });
    },

    setCalendarConfig: (config: CalendarConfig) => {
      set((state) => {
        state.calendarConfig = config;
      });
    },

    resetConfigs: () => {
      set((state) => {
        state.kanbanConfig = null;
        state.timelineConfig = null;
        state.calendarConfig = null;
      });
    },
  })),
);
