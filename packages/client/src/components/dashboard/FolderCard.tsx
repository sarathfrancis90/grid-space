import { useState } from "react";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    _count: { children: number; spreadsheets: number };
  };
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FolderCard({
  folder,
  onOpen,
  onRename,
  onDelete,
}: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = async () => {
    if (newName.trim() && newName !== folder.name) {
      await onRename(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const itemCount = folder._count.children + folder._count.spreadsheets;

  return (
    <div
      className="group relative flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-all hover:shadow-md hover:border-gray-300 cursor-pointer"
      onClick={() => !isRenaming && onOpen(folder.id)}
      data-testid={`folder-card-${folder.id}`}
    >
      {/* Folder icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="flex-shrink-0"
      >
        <path
          d="M2 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
          fill="#8ab4f8"
          stroke="#5e97f6"
          strokeWidth="0.5"
        />
      </svg>

      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full rounded border border-[#1a73e8] px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
            data-testid={`folder-rename-input-${folder.id}`}
          />
        ) : (
          <span className="block truncate text-sm font-medium text-gray-800">
            {folder.name}
          </span>
        )}
        <span className="text-xs text-gray-400">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Menu button */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-full p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
          data-testid={`folder-menu-btn-${folder.id}`}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
            <button
              onClick={() => {
                setShowMenu(false);
                setIsRenaming(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              data-testid={`folder-rename-btn-${folder.id}`}
            >
              Rename
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete(folder.id);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              data-testid={`folder-delete-btn-${folder.id}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
