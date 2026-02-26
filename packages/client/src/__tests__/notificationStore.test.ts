import { describe, it, expect, beforeEach } from "vitest";
import {
  useNotificationStore,
  type AppNotification,
} from "../stores/notificationStore";

describe("notificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({
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
    });
  });

  const makeNotification = (
    overrides: Partial<AppNotification> = {},
  ): AppNotification => ({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "general",
    title: "Test notification",
    message: "This is a test",
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  // S15-008: In-app notification center
  it("has correct initial state", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.isPanelOpen).toBe(false);
  });

  it("togglePanel toggles isPanelOpen", () => {
    useNotificationStore.getState().togglePanel();
    expect(useNotificationStore.getState().isPanelOpen).toBe(true);
    useNotificationStore.getState().togglePanel();
    expect(useNotificationStore.getState().isPanelOpen).toBe(false);
  });

  it("openPanel/closePanel work correctly", () => {
    useNotificationStore.getState().openPanel();
    expect(useNotificationStore.getState().isPanelOpen).toBe(true);
    useNotificationStore.getState().closePanel();
    expect(useNotificationStore.getState().isPanelOpen).toBe(false);
  });

  // S15-009: Notification for sharing
  it("addNotification adds share notification", () => {
    const notif = makeNotification({
      id: "n-share",
      type: "share",
      title: "Spreadsheet shared with you",
      message: 'Alice shared "Budget" with you',
    });

    useNotificationStore.getState().addNotification(notif);

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe("share");
    expect(state.unreadCount).toBe(1);
  });

  // S15-010: Notification for @mention
  it("addNotification adds mention notification", () => {
    const notif = makeNotification({
      id: "n-mention",
      type: "mention",
      title: "You were mentioned",
      message: "Bob mentioned you in a comment",
    });

    useNotificationStore.getState().addNotification(notif);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].type).toBe("mention");
    expect(state.unreadCount).toBe(1);
  });

  // S15-011: Notification for reply
  it("addNotification adds comment_reply notification", () => {
    const notif = makeNotification({
      id: "n-reply",
      type: "comment_reply",
      title: "New reply to your comment",
      message: "Carol replied to your comment",
    });

    useNotificationStore.getState().addNotification(notif);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].type).toBe("comment_reply");
  });

  // S15-013: Notification preferences
  it("setPreferences updates preferences", () => {
    useNotificationStore.getState().setPreferences({
      emailSharing: true,
      emailMentions: true,
    });

    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.emailSharing).toBe(true);
    expect(prefs.emailMentions).toBe(true);
    expect(prefs.emailComments).toBe(false); // not changed
  });

  // S15-014: Mark notification as read/unread
  it("markAsRead marks a notification as read", () => {
    const notif = makeNotification({ id: "n-read" });
    useNotificationStore.getState().addNotification(notif);
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    useNotificationStore.getState().markAsRead("n-read");

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("markAsUnread marks a notification as unread", () => {
    const notif = makeNotification({ id: "n-unread", read: true });
    useNotificationStore.getState().addNotification(notif);
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    useNotificationStore.getState().markAsUnread("n-unread");

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("markAllAsRead marks all as read", () => {
    useNotificationStore.getState().addNotification(makeNotification());
    useNotificationStore.getState().addNotification(makeNotification());
    useNotificationStore.getState().addNotification(makeNotification());
    expect(useNotificationStore.getState().unreadCount).toBe(3);

    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("deleteNotification removes a notification", () => {
    const notif = makeNotification({ id: "n-del" });
    useNotificationStore.getState().addNotification(notif);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    useNotificationStore.getState().deleteNotification("n-del");
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("setNotifications replaces the full list", () => {
    const notifs = [
      makeNotification({ id: "n-1" }),
      makeNotification({ id: "n-2", read: true }),
    ];

    useNotificationStore.getState().setNotifications(notifs);

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
  });

  it("notifications are prepended (newest first)", () => {
    useNotificationStore
      .getState()
      .addNotification(makeNotification({ id: "n-first" }));
    useNotificationStore
      .getState()
      .addNotification(makeNotification({ id: "n-second" }));

    const state = useNotificationStore.getState();
    expect(state.notifications[0].id).toBe("n-second");
    expect(state.notifications[1].id).toBe("n-first");
  });
});
