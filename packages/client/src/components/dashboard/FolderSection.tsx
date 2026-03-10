import { useState, useCallback, useEffect } from "react";
import { useFolderStore, FolderSummary } from "../../stores/folderStore";

interface FolderSectionProps {
  onFolderNavigate: (folderId: string | null) => void;
  currentFolderId: string | null;
}

export function FolderSection({
  onFolderNavigate,
  currentFolderId,
}: FolderSectionProps) {
  const folders = useFolderStore((s) => s.folders);
  const breadcrumbs = useFolderStore((s) => s.breadcrumbs);
  const isLoading = useFolderStore((s) => s.isLoading);
  const createFolder = useFolderStore((s) => s.createFolder);
  const renameFolder = useFolderStore((s) => s.renameFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);
  const navigateToFolder = useFolderStore((s) => s.navigateToFolder);

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  useEffect(() => {
    navigateToFolder(currentFolderId);
  }, [currentFolderId, navigateToFolder]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName("");
      setIsCreating(false);
    } catch {
      // Error handled in store
    }
  }, [createFolder, currentFolderId, newFolderName]);

  const handleRename = useCallback(
    async (id: string) => {
      if (!renameValue.trim()) return;
      try {
        await renameFolder(id, renameValue.trim());
        setRenamingId(null);
        setRenameValue("");
      } catch {
        // Error handled in store
      }
    },
    [renameFolder, renameValue],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteFolder(id);
        setContextMenuId(null);
      } catch {
        // Error handled in store
      }
    },
    [deleteFolder],
  );

  const handleFolderClick = useCallback(
    (folderId: string) => {
      onFolderNavigate(folderId);
    },
    [onFolderNavigate],
  );

  const startRename = useCallback((folder: FolderSummary) => {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
    setContextMenuId(null);
  }, []);

  return (
    <div className="mb-6" data-testid="folder-section">
      {/* Breadcrumbs */}
      {(breadcrumbs.length > 0 || currentFolderId) && (
        <nav
          className="mb-4 flex items-center gap-1 text-sm"
          data-testid="folder-breadcrumbs"
        >
          <button
            onClick={() => onFolderNavigate(null)}
            className="text-[#1a73e8] hover:underline font-medium"
            data-testid="breadcrumb-root"
          >
            My Drive
          </button>
          {breadcrumbs.map((bc) => (
            <span key={bc.id} className="flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-400"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
              <button
                onClick={() => onFolderNavigate(bc.id)}
                className={`hover:underline ${
                  bc.id === currentFolderId
                    ? "text-gray-700 font-medium"
                    : "text-[#1a73e8]"
                }`}
                data-testid={`breadcrumb-${bc.id}`}
              >
                {bc.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {/* Folder list + create button */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Folders
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#1a73e8] hover:bg-blue-50 transition-colors"
          data-testid="create-folder-btn"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="7" y1="3" x2="7" y2="11" />
            <line x1="3" y1="7" x2="11" y2="7" />
          </svg>
          New Folder
        </button>
      </div>

      {/* Create folder inline */}
      {isCreating && (
        <div
          className="mb-3 flex items-center gap-2"
          data-testid="create-folder-form"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="#5f6368"
            className="flex-shrink-0"
          >
            <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
          </svg>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewFolderName("");
              }
            }}
            placeholder="Folder name"
            className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
            autoFocus
            data-testid="new-folder-input"
          />
          <button
            onClick={handleCreateFolder}
            className="rounded-md bg-[#1a73e8] px-3 py-1 text-xs font-medium text-white hover:bg-[#1765cc]"
            data-testid="confirm-create-folder"
          >
            Create
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewFolderName("");
            }}
            className="rounded-md px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
            data-testid="cancel-create-folder"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Folders grid */}
      {isLoading && folders.length === 0 && (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-40 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      )}

      {!isLoading &&
        folders.length === 0 &&
        !isCreating &&
        !currentFolderId && (
          <p className="text-xs text-gray-400 mb-2">
            No folders yet. Create one to organize your spreadsheets.
          </p>
        )}

      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2" data-testid="folder-list">
          {folders.map((folder) => (
            <div key={folder.id} className="relative">
              {renamingId === folder.id ? (
                <div className="flex items-center gap-1 rounded-lg border border-[#1a73e8] bg-white px-3 py-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="#5f6368"
                    className="flex-shrink-0"
                  >
                    <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                  </svg>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(folder.id);
                      if (e.key === "Escape") {
                        setRenamingId(null);
                        setRenameValue("");
                      }
                    }}
                    onBlur={() => handleRename(folder.id)}
                    className="w-28 border-none bg-transparent text-sm focus:outline-none"
                    autoFocus
                    data-testid={`rename-folder-input-${folder.id}`}
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleFolderClick(folder.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuId(
                      contextMenuId === folder.id ? null : folder.id,
                    );
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
                  data-testid={`folder-${folder.id}`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="#5f6368"
                    className="flex-shrink-0"
                  >
                    <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                  </svg>
                  {folder.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(
                        contextMenuId === folder.id ? null : folder.id,
                      );
                    }}
                    className="ml-1 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    data-testid={`folder-menu-${folder.id}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="currentColor"
                    >
                      <circle cx="7" cy="3" r="1.2" />
                      <circle cx="7" cy="7" r="1.2" />
                      <circle cx="7" cy="11" r="1.2" />
                    </svg>
                  </button>
                </button>
              )}

              {/* Context menu */}
              {contextMenuId === folder.id && (
                <div
                  className="absolute left-0 top-full z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  data-testid={`folder-context-menu-${folder.id}`}
                >
                  <button
                    onClick={() => startRename(folder)}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
                    data-testid={`rename-folder-${folder.id}`}
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(folder.id)}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                    data-testid={`delete-folder-${folder.id}`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
