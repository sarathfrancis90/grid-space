import { useEffect } from "react";
import { useSharingStore } from "../../stores/sharingStore";

interface CollaboratorAvatarsProps {
  spreadsheetId: string;
}

export function CollaboratorAvatars({
  spreadsheetId,
}: CollaboratorAvatarsProps) {
  const collaborators = useSharingStore((s) => s.collaborators);
  const fetchCollaborators = useSharingStore((s) => s.fetchCollaborators);

  useEffect(() => {
    if (spreadsheetId) {
      fetchCollaborators(spreadsheetId);
    }
  }, [spreadsheetId, fetchCollaborators]);

  if (collaborators.length <= 1) return null;

  const visible = collaborators.slice(0, 4);
  const remaining = collaborators.length - visible.length;

  return (
    <div className="flex -space-x-2" data-testid="collaborator-avatars">
      {visible.map((c) => (
        <div
          key={c.id}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-xs font-medium text-white"
          title={c.user.name || c.user.email}
          data-testid={`avatar-${c.userId}`}
        >
          {c.user.avatarUrl ? (
            <img
              src={c.user.avatarUrl}
              alt={c.user.name || c.user.email}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            (c.user.name?.[0] || c.user.email[0]).toUpperCase()
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs font-medium text-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}
