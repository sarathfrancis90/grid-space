export type ViewType = "grid" | "kanban" | "timeline" | "calendar";

export interface KanbanConfig {
  statusCol: number;
  titleCol: number;
  descCol: number | null;
  colorCol: number | null;
}

export interface TimelineConfig {
  startDateCol: number;
  endDateCol: number | null;
  titleCol: number;
  colorCol: number | null;
}

export interface CalendarConfig {
  dateCol: number;
  titleCol: number;
  colorCol: number | null;
}
