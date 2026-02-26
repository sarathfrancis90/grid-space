import React from "react";
import { useRealtimeStore } from "../../stores/realtimeStore";
import type { PresenceUser } from "../../stores/realtimeStore";

interface AvatarProps {
  user: PresenceUser;
}

const Avatar = React.memo(function Avatar({ user }: AvatarProps) {
  const initials = (user.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-testid={`collaborator-avatar-${user.userId}`}
      className="relative group"
      title={user.name}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-7 h-7 rounded-full border-2"
          style={{ borderColor: user.color }}
        />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
          style={{ backgroundColor: user.color }}
        >
          {initials}
        </div>
      )}
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {user.name}
      </div>
    </div>
  );
});

export function CollaboratorAvatars(): React.ReactElement | null {
  const connectedUsers = useRealtimeStore((state) => state.connectedUsers);
  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);

  if (connectionStatus === "disconnected" || connectedUsers.length === 0) {
    return null;
  }

  // Deduplicate by userId (show unique users, not tabs)
  const uniqueUsers = new Map<string, PresenceUser>();
  for (const user of connectedUsers) {
    if (!uniqueUsers.has(user.userId)) {
      uniqueUsers.set(user.userId, user);
    }
  }

  const users = Array.from(uniqueUsers.values());
  const maxDisplay = 5;
  const displayUsers = users.slice(0, maxDisplay);
  const overflow = users.length - maxDisplay;

  return (
    <div
      data-testid="collaborator-avatars"
      className="flex items-center -space-x-1.5"
    >
      {displayUsers.map((user) => (
        <Avatar key={`${user.userId}-${user.tabId}`} user={user} />
      ))}
      {overflow > 0 && (
        <div
          data-testid="collaborator-overflow"
          className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default CollaboratorAvatars;
