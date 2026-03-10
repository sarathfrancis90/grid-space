import { useState, useEffect, useCallback } from "react";
import { useFolderStore, FolderSummary } from "../../stores/folderStore";
import { api } from "../../services/api";

interface MoveToFolderDialogProps {
  spreadsheetId: string;
  spreadsheetTitle: string;
  onClose: () => void;
  onMoved: () => void;
}

export function MoveToFolderDialog({
  spreadsheetId,
  spreadsheetTitle,
  onClose,
  onMoved,
}: MoveToFolderDialogProps) {
  const moveSpreadsheetToFolder = useFolderStore(
    (s) => s.moveSpreadsheetToFolder,
  );
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    async function loadFolders() {
      try {
        const result = await api.get<FolderSummary[]>("/folders");
        setFolders(result);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    loadFolders();
  }, []);

  const handleMove = useCallback(async () => {
    setIsMoving(true);
    try {
      await moveSpreadsheetToFolder(spreadsheetId, selectedFolderId);
      onMoved();
      onClose();
    } catch {
      // Error handled in store
    } finally {
      setIsMoving(false);
    }
  }, [
    moveSpreadsheetToFolder,
    spreadsheetId,
    selectedFolderId,
    onMoved,
    onClose,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
      data-testid="move-to-folder-dialog"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-gray-800">
          Move to folder
        </h3>
        <p className="mb-4 text-sm text-gray-500 truncate">
          {spreadsheetTitle}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1a73e8]" />
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
            {/* Root option */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                selectedFolderId === null
                  ? "bg-blue-50 text-[#1a73e8]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              data-testid="move-to-root"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              My Drive (root)
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  selectedFolderId === folder.id
                    ? "bg-blue-50 text-[#1a73e8]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                data-testid={`move-to-folder-${folder.id}`}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="#5f6368">
                  <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                </svg>
                {folder.name}
              </button>
            ))}

            {folders.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-gray-400">
                No folders yet
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            data-testid="cancel-move"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving}
            className="rounded-lg bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1765cc] disabled:opacity-50"
            data-testid="confirm-move"
          >
            {isMoving ? "Moving..." : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
