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

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <GridSpaceLogo size={28} />
            <h1 className="text-xl font-semibold text-gray-900">GridSpace</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600" data-testid="user-name">
              {user?.name || user?.email}
            </span>
            <button
              onClick={() => navigate("/profile")}
              className="rounded-full bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
              data-testid="profile-link"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
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

        {/* Create + Search Bar */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="create-spreadsheet-btn"
          >
            + New Spreadsheet
          </button>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search spreadsheets..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              data-testid="search-input"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm ${viewMode === "grid" ? "bg-gray-200" : ""}`}
              data-testid="view-grid-btn"
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-gray-200" : ""}`}
              data-testid="view-list-btn"
            >
              List
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex items-center gap-6 border-b border-gray-200">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`border-b-2 pb-2 text-sm font-medium ${
                filter === f.value
                  ? "border-blue-600 text-blue-600"
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
            className="rounded border border-gray-300 px-2 py-1 text-xs"
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
            className="py-16 text-center text-gray-500"
            data-testid="empty-state"
          >
            <p className="mb-4 text-lg">No spreadsheets found</p>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
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
                className="divide-y divide-gray-200 rounded-lg border border-gray-200"
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
