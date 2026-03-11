import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCloudStore } from "../../stores/cloudStore";
import { useAuthStore } from "../../stores/authStore";
import { useFolderStore } from "../../stores/folderStore";
import { SpreadsheetCard } from "./SpreadsheetCard";
import { SpreadsheetListItem } from "./SpreadsheetListItem";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { TemplateGallery } from "./TemplateGallery";
import { TrashView } from "./TrashView";
import { GridSpaceLogo } from "../ui/GridSpaceLogo";
import { FolderBreadcrumbs } from "./FolderBreadcrumbs";
import { FolderCard } from "./FolderCard";
import { groupByDate } from "../../utils/dateGrouping";

type FilterType = "all" | "owned" | "shared" | "starred";
type DashboardTab = "spreadsheets" | "trash";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const spreadsheets = useCloudStore((s) => s.spreadsheets);
  const isListLoading = useCloudStore((s) => s.isListLoading);
  const error = useCloudStore((s) => s.error);
  const filter = useCloudStore((s) => s.filter);
  const search = useCloudStore((s) => s.search);
  const sortBy = useCloudStore((s) => s.sortBy);
  const sortDir = useCloudStore((s) => s.sortDir);
  const viewMode = useCloudStore((s) => s.viewMode);
  const page = useCloudStore((s) => s.page);
  const totalPages = useCloudStore((s) => s.totalPages);
  const fetchSpreadsheets = useCloudStore((s) => s.fetchSpreadsheets);
  const createSpreadsheet = useCloudStore((s) => s.createSpreadsheet);
  const deleteSpreadsheet = useCloudStore((s) => s.deleteSpreadsheet);
  const duplicateSpreadsheet = useCloudStore((s) => s.duplicateSpreadsheet);
  const toggleStar = useCloudStore((s) => s.toggleStar);
  const updateSpreadsheet = useCloudStore((s) => s.updateSpreadsheet);
  const setFilter = useCloudStore((s) => s.setFilter);
  const setSearch = useCloudStore((s) => s.setSearch);
  const setSortBy = useCloudStore((s) => s.setSortBy);
  const toggleSortDir = useCloudStore((s) => s.toggleSortDir);
  const setViewMode = useCloudStore((s) => s.setViewMode);
  const setPage = useCloudStore((s) => s.setPage);

  // Folder state
  const folders = useFolderStore((s) => s.folders);
  const currentFolderId = useFolderStore((s) => s.currentFolderId);
  const breadcrumbs = useFolderStore((s) => s.breadcrumbs);
  const fetchFolders = useFolderStore((s) => s.fetchFolders);
  const navigateToFolder = useFolderStore((s) => s.navigateToFolder);
  const createFolder = useFolderStore((s) => s.createFolder);
  const renameFolder = useFolderStore((s) => s.renameFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);
  const moveSpreadsheetToFolder = useFolderStore(
    (s) => s.moveSpreadsheetToFolder,
  );

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchInput, setSearchInput] = useState(search);
  const [activeTab, setActiveTab] = useState<DashboardTab>("spreadsheets");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchSpreadsheets();
      fetchFolders();
    }
  }, [
    isAuthenticated,
    filter,
    search,
    sortBy,
    sortDir,
    page,
    fetchSpreadsheets,
    fetchFolders,
  ]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setSearch]);

  const handleCreate = useCallback(async () => {
    try {
      const spreadsheet = await createSpreadsheet();
      navigate(`/spreadsheet/${spreadsheet.id}`);
    } catch {
      // Error handled in store
    }
  }, [createSpreadsheet, navigate]);

  const handleOpen = useCallback(
    (id: string) => {
      navigate(`/spreadsheet/${id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSpreadsheet(id);
    },
    [deleteSpreadsheet],
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      await duplicateSpreadsheet(id);
    },
    [duplicateSpreadsheet],
  );

  const handleToggleStar = useCallback(
    async (id: string) => {
      await toggleStar(id);
    },
    [toggleStar],
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      await updateSpreadsheet(id, { title });
    },
    [updateSpreadsheet],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch {
      // Error handled in store
    }
  }, [newFolderName, createFolder]);

  const handleMoveToFolder = useCallback(
    async (spreadsheetId: string, folderId: string | null) => {
      try {
        await moveSpreadsheetToFolder(spreadsheetId, folderId);
        // Refresh to show updated state
        fetchSpreadsheets();
        fetchFolders();
      } catch {
        // Error handled in store
      }
    },
    [moveSpreadsheetToFolder, fetchSpreadsheets, fetchFolders],
  );

  const handleOpenFolder = useCallback(
    (folderId: string) => {
      navigateToFolder(folderId);
    },
    [navigateToFolder],
  );

  const handleBreadcrumbNavigate = useCallback(
    (folderId: string | null) => {
      navigateToFolder(folderId);
    },
    [navigateToFolder],
  );

  // Filter spreadsheets to only show those in the current folder
  const filteredSpreadsheets = currentFolderId
    ? spreadsheets.filter((s) => s.folderId === currentFolderId)
    : spreadsheets.filter((s) => !s.folderId);

  // Group spreadsheets by date for list view
  const groupedSpreadsheets = useMemo(
    () => groupByDate(filteredSpreadsheets, (s) => s.updatedAt),
    [filteredSpreadsheets],
  );

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Owned by me", value: "owned" },
    { label: "Shared with me", value: "shared" },
    { label: "Starred", value: "starred" },
  ];

  const sortOptions: {
    label: string;
    value: "title" | "updatedAt" | "createdAt";
  }[] = [
    { label: "Last modified", value: "updatedAt" },
    { label: "Date created", value: "createdAt" },
    { label: "Name", value: "title" },
  ];

  const userInitial = (user?.name ?? user?.email ?? "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-8">
            <GridSpaceLogo size={32} />
            <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
              GridSpace
            </h1>
          </div>

          {/* Centered search bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-2xl">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-full bg-gray-100 py-2.5 pl-12 pr-5 text-sm text-gray-700 placeholder-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border focus:border-[#1a73e8]"
                style={{ padding: "10px 20px 10px 48px" }}
                data-testid="search-input"
              />
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3 ml-8">
            <button
              onClick={() => navigate("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-medium text-white transition-colors hover:bg-[#1765cc] overflow-hidden"
              data-testid="profile-link"
              title={user?.name || user?.email || "Profile"}
              style={{ padding: 0, overflow: "hidden" }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full object-cover"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                userInitial
              )}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
              style={{ padding: "6px 12px" }}
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Template Gallery — full-width warm-gray band */}
      <div
        className="border-b border-gray-200 bg-[#f1f3f4]"
        style={{ backgroundColor: "#f1f3f4" }}
      >
        <div
          className="mx-auto max-w-7xl px-6 py-8"
          style={{ padding: "32px 24px" }}
        >
          <TemplateGallery />
        </div>
      </div>

      <main
        className="mx-auto max-w-7xl px-6 py-8"
        style={{ padding: "32px 24px" }}
      >
        {/* Section header + Create + New Folder + View Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleCreate}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#1765cc] hover:shadow-lg active:scale-[0.98]"
            style={{ padding: "10px 24px" }}
            data-testid="create-spreadsheet-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="9" y1="3" x2="9" y2="15" />
              <line x1="3" y1="9" x2="15" y2="9" />
            </svg>
            New Spreadsheet
          </button>

          <button
            onClick={() => setIsCreatingFolder(true)}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98]"
            style={{ padding: "10px 20px" }}
            data-testid="create-folder-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            New Folder
          </button>

          <div className="flex-1" />

          {/* View Mode Toggle */}
          <div className="flex rounded-full border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              style={{ padding: "6px 12px" }}
              data-testid="view-grid-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
                <rect x="1" y="1" width="7" height="7" rx="1.5" />
                <rect x="10" y="1" width="7" height="7" rx="1.5" />
                <rect x="1" y="10" width="7" height="7" rx="1.5" />
                <rect x="10" y="10" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              style={{ padding: "6px 12px" }}
              data-testid="view-list-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
                <rect x="1" y="3" width="16" height="2" rx="1" />
                <rect x="1" y="8" width="16" height="2" rx="1" />
                <rect x="1" y="13" width="16" height="2" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Folder Breadcrumbs */}
        {currentFolderId && (
          <div className="mb-4">
            <FolderBreadcrumbs
              breadcrumbs={breadcrumbs}
              onNavigate={handleBreadcrumbNavigate}
            />
          </div>
        )}

        {/* New Folder inline form */}
        {isCreatingFolder && (
          <div
            className="mb-4 flex items-center gap-3"
            data-testid="new-folder-form"
          >
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
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
              className="rounded-md border border-[#1a73e8] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
              data-testid="new-folder-input"
            />
            <button
              onClick={handleCreateFolder}
              className="rounded-md bg-[#1a73e8] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1765cc]"
              data-testid="new-folder-submit"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName("");
              }}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
              data-testid="new-folder-cancel"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Section heading */}
        <h2 className="mb-3 text-base font-medium text-gray-700">
          {activeTab === "trash"
            ? "Trash"
            : currentFolderId
              ? breadcrumbs[breadcrumbs.length - 1]?.name || "Folder"
              : "Recent spreadsheets"}
        </h2>

        {/* Filter Tabs */}
        <div className="mb-5 flex items-center border-b border-gray-200">
          <div className="flex items-center">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setActiveTab("spreadsheets");
                  setFilter(f.value);
                }}
                className={`relative px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
                  activeTab === "spreadsheets" && filter === f.value
                    ? "text-[#1a73e8]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ padding: "4px 16px 12px 16px" }}
                data-testid={`filter-${f.value}`}
              >
                {f.label}
                {activeTab === "spreadsheets" && filter === f.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#1a73e8]" />
                )}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("trash")}
              className={`relative px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === "trash"
                  ? "text-[#1a73e8]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ padding: "4px 16px 12px 16px" }}
              data-testid="filter-trash"
            >
              Trash
              {activeTab === "trash" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#1a73e8]" />
              )}
            </button>
          </div>
        </div>

        {/* Trash View */}
        {activeTab === "trash" && <TrashView />}

        {/* Spreadsheets Content */}
        {activeTab === "spreadsheets" && (
          <>
            {/* Sort Controls */}
            <div className="mb-5 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "title" | "updatedAt" | "createdAt",
                  )
                }
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-gray-300 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]/30"
                style={{ padding: "4px 10px" }}
                data-testid="sort-select"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={toggleSortDir}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                style={{ padding: "4px 8px" }}
                data-testid="sort-dir-btn"
              >
                {sortDir === "desc" ? "Newest first" : "Oldest first"}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {sortDir === "desc" ? (
                    <path d="M6 2v8M3 7l3 3 3-3" />
                  ) : (
                    <path d="M6 10V2M3 5l3-3 3 3" />
                  )}
                </svg>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600"
                data-testid="dashboard-error"
              >
                {error}
              </div>
            )}

            {/* Loading Skeleton */}
            {isListLoading && <DashboardSkeleton viewMode={viewMode} />}

            {/* Folders */}
            {!isListLoading && folders.length > 0 && (
              <div
                className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                data-testid="folder-grid"
              >
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    onOpen={handleOpenFolder}
                    onRename={renameFolder}
                    onDelete={deleteFolder}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isListLoading &&
              filteredSpreadsheets.length === 0 &&
              folders.length === 0 && (
                <div
                  className="flex flex-col items-center py-24"
                  data-testid="empty-state"
                >
                  <svg
                    width="96"
                    height="96"
                    viewBox="0 0 96 96"
                    fill="none"
                    className="mb-8"
                  >
                    <rect
                      x="12"
                      y="12"
                      width="72"
                      height="72"
                      rx="10"
                      fill="#eff6ff"
                      stroke="#1a73e8"
                      strokeWidth="2"
                    />
                    <line
                      x1="12"
                      y1="36"
                      x2="84"
                      y2="36"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="12"
                      y1="60"
                      x2="84"
                      y2="60"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="36"
                      y1="12"
                      x2="36"
                      y2="84"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="60"
                      y1="12"
                      x2="60"
                      y2="84"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p className="mb-2 text-xl font-semibold text-gray-800">
                    {currentFolderId
                      ? "This folder is empty"
                      : "No spreadsheets yet"}
                  </p>
                  <p className="mb-8 text-sm text-gray-500">
                    {currentFolderId
                      ? "Move spreadsheets here or create a new one"
                      : "Create your first spreadsheet to get started"}
                  </p>
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#1765cc] hover:shadow-lg active:scale-[0.98]"
                    style={{ padding: "10px 24px" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="9" y1="3" x2="9" y2="15" />
                      <line x1="3" y1="9" x2="15" y2="9" />
                    </svg>
                    Create your first spreadsheet
                  </button>
                </div>
              )}

            {/* Spreadsheet Grid/List */}
            {!isListLoading && filteredSpreadsheets.length > 0 && (
              <>
                {viewMode === "grid" ? (
                  <div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    data-testid="spreadsheet-grid"
                  >
                    {filteredSpreadsheets.map((s) => (
                      <SpreadsheetCard
                        key={s.id}
                        spreadsheet={s}
                        onOpen={handleOpen}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onToggleStar={handleToggleStar}
                        onRename={handleRename}
                        folders={folders}
                        onMoveToFolder={handleMoveToFolder}
                      />
                    ))}
                  </div>
                ) : (
                  <div data-testid="spreadsheet-list" className="space-y-6">
                    {groupedSpreadsheets.map((group) => (
                      <div key={group.label}>
                        {/* Date group heading */}
                        <h3
                          className="mb-2 text-sm font-medium text-gray-700"
                          data-testid={`date-group-${group.label}`}
                        >
                          {group.label}
                        </h3>
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          {/* Column header */}
                          <div
                            className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-2"
                            style={{ padding: "8px 20px" }}
                          >
                            <span className="w-4 flex-shrink-0" />
                            <span className="w-4 flex-shrink-0" />
                            <span className="min-w-0 flex-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Name
                            </span>
                            <span className="flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Owner
                            </span>
                            <span className="w-36 flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Last opened by me
                            </span>
                            <span className="w-8 flex-shrink-0" />
                          </div>
                          <div className="divide-y divide-gray-100">
                            {group.items.map((s) => (
                              <SpreadsheetListItem
                                key={s.id}
                                spreadsheet={s}
                                onOpen={handleOpen}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onToggleStar={handleToggleStar}
                                onRename={handleRename}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                      style={{ padding: "8px 16px" }}
                      data-testid="prev-page-btn"
                    >
                      Previous
                    </button>
                    <span
                      className="px-3 text-sm text-gray-500"
                      data-testid="page-info"
                    >
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                      style={{ padding: "8px 16px" }}
                      data-testid="next-page-btn"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
