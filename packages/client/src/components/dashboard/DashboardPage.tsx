import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCloudStore } from "../../stores/cloudStore";
import { useAuthStore } from "../../stores/authStore";
import { SpreadsheetCard } from "./SpreadsheetCard";
import { SpreadsheetListItem } from "./SpreadsheetListItem";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { TemplateGallery } from "./TemplateGallery";
import { GridSpaceLogo } from "../ui/GridSpaceLogo";

type FilterType = "all" | "owned" | "shared" | "starred";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const {
    spreadsheets,
    isListLoading,
    error,
    filter,
    search,
    sortBy,
    sortDir,
    viewMode,
    page,
    totalPages,
    fetchSpreadsheets,
    createSpreadsheet,
    deleteSpreadsheet,
    duplicateSpreadsheet,
    toggleStar,
    updateSpreadsheet,
    setFilter,
    setSearch,
    setSortBy,
    toggleSortDir,
    setViewMode,
    setPage,
  } = useCloudStore();

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    fetchSpreadsheets();
  }, [filter, search, sortBy, sortDir, page, fetchSpreadsheets]);

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
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="flex items-center gap-2">
            <GridSpaceLogo size={28} />
            <h1 className="text-xl font-semibold text-gray-800">GridSpace</h1>
          </div>

          {/* Centered search bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-lg">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                className="w-full rounded-lg bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              data-testid="profile-link"
              title={user?.name || user?.email || "Profile"}
            >
              {userInitial}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Template Gallery */}
        <TemplateGallery />

        {/* Create + View Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleCreate}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            data-testid="create-spreadsheet-btn"
          >
            + New Spreadsheet
          </button>

          <div className="flex-1" />

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-l-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              data-testid="view-grid-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-r-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              data-testid="view-list-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="1" y="7" width="14" height="2" rx="1" />
                <rect x="1" y="12" width="14" height="2" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs — Google-style underline */}
        <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              data-testid={`filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "title" | "updatedAt" | "createdAt")
            }
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
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
            className="text-xs text-gray-500 hover:text-gray-700"
            data-testid="sort-dir-btn"
          >
            {sortDir === "desc" ? "Newest first" : "Oldest first"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
            data-testid="dashboard-error"
          >
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {isListLoading && <DashboardSkeleton viewMode={viewMode} />}

        {/* Empty State */}
        {!isListLoading && spreadsheets.length === 0 && (
          <div
            className="flex flex-col items-center py-20"
            data-testid="empty-state"
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="mb-6"
            >
              <rect
                x="10"
                y="10"
                width="60"
                height="60"
                rx="8"
                fill="#ecfdf5"
                stroke="#0F9D58"
                strokeWidth="2"
              />
              <line
                x1="10"
                y1="30"
                x2="70"
                y2="30"
                stroke="#0F9D58"
                strokeWidth="1.5"
              />
              <line
                x1="10"
                y1="50"
                x2="70"
                y2="50"
                stroke="#0F9D58"
                strokeWidth="1.5"
              />
              <line
                x1="30"
                y1="10"
                x2="30"
                y2="70"
                stroke="#0F9D58"
                strokeWidth="1.5"
              />
              <line
                x1="50"
                y1="10"
                x2="50"
                y2="70"
                stroke="#0F9D58"
                strokeWidth="1.5"
              />
            </svg>
            <p className="mb-2 text-lg font-medium text-gray-700">
              No spreadsheets yet
            </p>
            <p className="mb-6 text-sm text-gray-400">
              Create your first spreadsheet to get started
            </p>
            <button
              onClick={handleCreate}
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Create your first spreadsheet
            </button>
          </div>
        )}

        {/* Spreadsheet Grid/List */}
        {!isListLoading && spreadsheets.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                data-testid="spreadsheet-grid"
              >
                {spreadsheets.map((s) => (
                  <SpreadsheetCard
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
            ) : (
              <div
                className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white"
                data-testid="spreadsheet-list"
              >
                {spreadsheets.map((s) => (
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
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  data-testid="prev-page-btn"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500" data-testid="page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  data-testid="next-page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
