/**
 * Groups items by date ranges matching Google Sheets dashboard layout:
 * "Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Earlier"
 */

export type DateGroup =
  | "Today"
  | "Yesterday"
  | "Previous 7 days"
  | "Previous 30 days"
  | "Earlier";

const DATE_GROUP_ORDER: DateGroup[] = [
  "Today",
  "Yesterday",
  "Previous 7 days",
  "Previous 30 days",
  "Earlier",
];

export interface GroupedItems<T> {
  label: DateGroup;
  items: T[];
}

function calendarDaysDiff(now: Date, date: Date): number {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86400000,
  );
}

function getDateGroup(dateString: string, now: Date): DateGroup {
  const date = new Date(dateString);
  const daysDiff = calendarDaysDiff(now, date);

  if (daysDiff <= 0) return "Today";
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff < 7) return "Previous 7 days";
  if (daysDiff < 30) return "Previous 30 days";
  return "Earlier";
}

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
  now: Date = new Date(),
): GroupedItems<T>[] {
  const groups = new Map<DateGroup, T[]>();

  for (const item of items) {
    const group = getDateGroup(getDate(item), now);
    const existing = groups.get(group);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(group, [item]);
    }
  }

  return DATE_GROUP_ORDER.filter((label) => groups.has(label)).map((label) => ({
    label,
    items: groups.get(label)!,
  }));
}

export function formatLastOpened(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const daysDiff = calendarDaysDiff(now, date);

  if (daysDiff <= 0) {
    const hoursDiff = Math.floor((now.getTime() - date.getTime()) / 3600000);
    if (hoursDiff < 1) return "Just now";
    return `${hoursDiff}h ago`;
  }
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
