import { useEffect, useState, useCallback } from "react";
import { useSharingStore } from "../../stores/sharingStore";
import { useAuthStore } from "../../stores/authStore";

interface ShareDialogProps {
  spreadsheetId: string;
}

type RoleOption = "viewer" | "commenter" | "editor";

export function ShareDialog({ spreadsheetId }: ShareDialogProps) {
  const user = useAuthStore((s) => s.user);
  const collaborators = useSharingStore((s) => s.collaborators);
  const shareLink = useSharingStore((s) => s.shareLink);
  const isLoading = useSharingStore((s) => s.isLoading);
  const isDialogOpen = useSharingStore((s) => s.isDialogOpen);
  const error = useSharingStore((s) => s.error);
  const fetchCollaborators = useSharingStore((s) => s.fetchCollaborators);
  const addCollaborator = useSharingStore((s) => s.addCollaborator);
  const changeRole = useSharingStore((s) => s.changeRole);
  const removeCollaborator = useSharingStore((s) => s.removeCollaborator);
  const fetchShareLink = useSharingStore((s) => s.fetchShareLink);
  const createShareLink = useSharingStore((s) => s.createShareLink);
  const disableShareLink = useSharingStore((s) => s.disableShareLink);
  const closeDialog = useSharingStore((s) => s.closeDialog);
  const clearError = useSharingStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleOption>("viewer");
  const [copied, setCopied] = useState(false);
  const [linkRole, setLinkRole] = useState<RoleOption>("viewer");

  useEffect(() => {
    if (isDialogOpen && spreadsheetId) {
      fetchCollaborators(spreadsheetId);
      fetchShareLink(spreadsheetId);
    }
  }, [isDialogOpen, spreadsheetId, fetchCollaborators, fetchShareLink]);

  useEffect(() => {
    if (!isDialogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen, closeDialog]);

  const handleAdd = useCallback(async () => {
    if (!email.trim()) return;
    try {
      await addCollaborator(spreadsheetId, email.trim(), role);
      setEmail("");
    } catch {
      // Error shown in store
    }
  }, [email, role, spreadsheetId, addCollaborator]);

  const handleCopyLink = useCallback(async () => {
    if (!shareLink.shareLink) return;
    const url = `${window.location.origin}/share/${shareLink.shareLink}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink.shareLink]);

  const handleCreateLink = useCallback(async () => {
    await createShareLink(spreadsheetId, linkRole);
  }, [spreadsheetId, linkRole, createShareLink]);

  const handleDisableLink = useCallback(async () => {
    await disableShareLink(spreadsheetId);
  }, [spreadsheetId, disableShareLink]);

  if (!isDialogOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="share-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDialog();
      }}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        data-testid="share-dialog"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share</h2>
          <button
            onClick={closeDialog}
            className="text-gray-400 hover:text-gray-600"
            data-testid="share-dialog-close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {/* Error */}
        {error && (
          <div
            className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600"
            data-testid="share-error"
          >
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Add by email */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Add people
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              data-testid="share-email-input"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleOption)}
              className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
              data-testid="share-role-select"
            >
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
            </select>
            <button
              onClick={handleAdd}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              data-testid="share-add-btn"
            >
              Add
            </button>
          </div>
        </div>

        {/* Collaborator list */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            People with access
          </h3>
          {isLoading ? (
            <div className="py-4 text-center text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <div
              className="max-h-48 space-y-2 overflow-y-auto"
              data-testid="collaborator-list"
            >
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50"
                  data-testid={`collaborator-${c.userId}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                      {c.user.name?.[0]?.toUpperCase() ||
                        c.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.user.name || c.user.email}
                        {c.userId === user?.id && (
                          <span className="ml-1 text-xs text-gray-400">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{c.user.email}</p>
                    </div>
                  </div>

                  {c.role === "owner" ? (
                    <span className="text-xs text-gray-500">Owner</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <select
                        value={c.role}
                        onChange={(e) =>
                          changeRole(
                            spreadsheetId,
                            c.userId,
                            e.target.value as RoleOption,
                          )
                        }
                        className="rounded border border-gray-200 px-1.5 py-0.5 text-xs"
                        data-testid={`role-select-${c.userId}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="commenter">Commenter</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        onClick={() =>
                          removeCollaborator(spreadsheetId, c.userId)
                        }
                        className="ml-1 text-gray-400 hover:text-red-500"
                        title="Remove"
                        data-testid={`remove-btn-${c.userId}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share link section */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            Share via link
          </h3>

          {shareLink.shareLink ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/share/${shareLink.shareLink}`}
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs"
                  data-testid="share-link-url"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs hover:bg-gray-100"
                  data-testid="copy-link-btn"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Anyone with link: {shareLink.shareLinkRole}
                </span>
                <button
                  onClick={handleDisableLink}
                  className="text-xs text-red-500 hover:text-red-700"
                  data-testid="disable-link-btn"
                >
                  Disable link
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value as RoleOption)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                data-testid="link-role-select"
              >
                <option value="viewer">Can view</option>
                <option value="commenter">Can comment</option>
                <option value="editor">Can edit</option>
              </select>
              <button
                onClick={handleCreateLink}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                data-testid="create-link-btn"
              >
                Create link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
