/**
 * NotificationItem — single notification row in the notification center.
 * S15-009: share notification
 * S15-010: @mention notification
 * S15-011: reply notification
 * S15-014: mark as read/unread
 */
import { useCallback } from "react";
import {
  useNotificationStore,
  type AppNotification,
} from "../../stores/notificationStore";

interface NotificationItemProps {
  notification: AppNotification;
}

function getIcon(type: AppNotification["type"]): string {
  switch (type) {
    case "share":
      return "Share";
    case "mention":
      return "@";
    case "comment_reply":
      return "Reply";
    default:
      return "Info";
  }
}

function getIconColor(type: AppNotification["type"]): string {
  switch (type) {
    case "share":
      return "bg-green-100 text-green-600";
    case "mention":
      return "bg-blue-100 text-blue-600";
    case "comment_reply":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAsUnread = useNotificationStore((s) => s.markAsUnread);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);

  const handleToggleRead = useCallback(() => {
    if (notification.read) {
      markAsUnread(notification.id);
    } else {
      markAsRead(notification.id);
    }
  }, [notification.id, notification.read, markAsRead, markAsUnread]);

  const handleDelete = useCallback(() => {
    deleteNotification(notification.id);
  }, [notification.id, deleteNotification]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
        !notification.read ? "bg-blue-50/50" : ""
      }`}
      data-testid={`notification-item-${notification.id}`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getIconColor(notification.type)}`}
      >
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${!notification.read ? "font-medium text-gray-900" : "text-gray-700"}`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={handleToggleRead}
          className="p-1 rounded hover:bg-gray-200"
          title={notification.read ? "Mark as unread" : "Mark as read"}
          data-testid={`notif-toggle-read-${notification.id}`}
          type="button"
        >
          <div
            className={`w-2 h-2 rounded-full ${!notification.read ? "bg-blue-500" : "bg-gray-300"}`}
          />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
          title="Delete"
          data-testid={`notif-delete-${notification.id}`}
          type="button"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
