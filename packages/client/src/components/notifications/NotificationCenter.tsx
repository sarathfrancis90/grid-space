/**
 * NotificationCenter — bell icon with badge count + dropdown notification list.
 * S15-008: In-app notification center
 * S15-014: Mark notification as read/unread
 */
import { useCallback, useRef, useEffect } from "react";
import {
  useNotificationStore,
  type AppNotification,
} from "../../stores/notificationStore";
import { NotificationItem } from "./NotificationItem";

export function NotificationCenter() {
  const isPanelOpen = useNotificationStore((s) => s.isPanelOpen);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const togglePanel = useNotificationStore((s) => s.togglePanel);
  const closePanel = useNotificationStore((s) => s.closePanel);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!isPanelOpen) return;

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isPanelOpen, closePanel]);

  const handleToggle = useCallback(() => {
    togglePanel();
  }, [togglePanel]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  return (
    <div className="relative" ref={panelRef} data-testid="notification-center">
      {/* Bell icon button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100"
        data-testid="notification-bell"
        type="button"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            data-testid="notification-badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isPanelOpen && (
        <div
          className="absolute right-0 top-10 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col"
          data-testid="notification-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-900">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700"
                data-testid="mark-all-read-btn"
                type="button"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                className="px-4 py-8 text-center text-sm text-gray-400"
                data-testid="no-notifications"
              >
                No notifications
              </div>
            ) : (
              notifications.map((notif: AppNotification) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
