import React from "react";

interface Breadcrumb {
  id: string;
  name: string;
}

interface FolderBreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
  onNavigate: (folderId: string | null) => void;
}

export const FolderBreadcrumbs = React.memo(function FolderBreadcrumbs({
  breadcrumbs,
  onNavigate,
}: FolderBreadcrumbsProps) {
  if (breadcrumbs.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1 text-sm text-gray-500"
      data-testid="folder-breadcrumbs"
    >
      <button
        onClick={() => onNavigate(null)}
        className="rounded px-1.5 py-0.5 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        data-testid="breadcrumb-root"
      >
        My Drive
      </button>
      {breadcrumbs.map((crumb) => (
        <React.Fragment key={crumb.id}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="flex-shrink-0 text-gray-300"
          >
            <path
              d="M6 4l4 4-4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <button
            onClick={() => onNavigate(crumb.id)}
            className="rounded px-1.5 py-0.5 hover:bg-gray-100 hover:text-gray-700 transition-colors truncate max-w-[200px]"
            title={crumb.name}
            data-testid={`breadcrumb-${crumb.id}`}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
});
