/**
 * Notification store — manages in-app notifications.
 * Notifications come from: sharing events, @mentions, comment replies.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type NotificationType =
  | "share"
  | "mention"
  | "comment_reply"
  | "general";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  spreadsheetId?: string;
  cellRef?: string;
  fromUser?: { name: string; email: string; avatarUrl?: string };
}

export interface NotificationPreferences {
  emailSharing: boolean;
  emailComments: boolean;
  emailMentions: boolean;
  inAppSharing: boolean;
  inAppComments: boolean;
  inAppMentions: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isPanelOpen: boolean;
  preferences: NotificationPreferences;

  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setPreferences: (prefs: Partial<NotificationPreferences>) => void;
}

function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationState>()(
  immer((set) => ({
    notifications: [],
    unreadCount: 0,
    isPanelOpen: false,
    preferences: {
      emailSharing: false,
      emailComments: false,
      emailMentions: false,
      inAppSharing: true,
      inAppComments: true,
      inAppMentions: true,
    },

    addNotification: (notification) => {
      set((state) => {
        state.notifications.unshift(notification);
        state.unreadCount = countUnread(state.notifications);
      });
    },

    markAsRead: (id) => {
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        if (notif) {
          notif.read = true;
          state.unreadCount = countUnread(state.notifications);
        }
      });
    },

    markAsUnread: (id) => {
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        if (notif) {
          notif.read = false;
          state.unreadCount = countUnread(state.notifications);
        }
      });
    },

    markAllAsRead: () => {
      set((state) => {
        for (const n of state.notifications) {
          n.read = true;
        }
        state.unreadCount = 0;
      });
    },

    deleteNotification: (id) => {
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
        state.unreadCount = countUnread(state.notifications);
      });
    },

    setNotifications: (notifications) => {
      set((state) => {
        state.notifications = notifications;
        state.unreadCount = countUnread(notifications);
      });
    },

    openPanel: () => {
      set((state) => {
        state.isPanelOpen = true;
      });
    },

    closePanel: () => {
      set((state) => {
        state.isPanelOpen = false;
      });
    },

    togglePanel: () => {
      set((state) => {
        state.isPanelOpen = !state.isPanelOpen;
      });
    },

    setPreferences: (prefs) => {
      set((state) => {
        Object.assign(state.preferences, prefs);
      });
    },
  })),
);
