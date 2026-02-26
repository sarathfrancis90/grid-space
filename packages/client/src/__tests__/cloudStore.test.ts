import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCloudStore } from "../stores/cloudStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("cloudStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useCloudStore.setState({
      spreadsheets: [],
      currentSpreadsheet: null,
      isLoading: false,
      isListLoading: false,
      isSaving: false,
      saveStatus: "idle",
      error: null,
      filter: "all",
      search: "",
      sortBy: "updatedAt",
      sortDir: "desc",
      viewMode: "grid",
      page: 1,
      totalPages: 1,
      total: 0,
    });
  });

  it("has correct initial state", () => {
    const state = useCloudStore.getState();
    expect(state.spreadsheets).toEqual([]);
    expect(state.currentSpreadsheet).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.filter).toBe("all");
    expect(state.viewMode).toBe("grid");
  });

  it("setFilter updates filter and resets page", () => {
    useCloudStore.setState({ page: 3 });
    useCloudStore.getState().setFilter("starred");
    const state = useCloudStore.getState();
    expect(state.filter).toBe("starred");
    expect(state.page).toBe(1);
  });

  it("setSearch updates search and resets page", () => {
    useCloudStore.setState({ page: 2 });
    useCloudStore.getState().setSearch("Budget");
    const state = useCloudStore.getState();
    expect(state.search).toBe("Budget");
    expect(state.page).toBe(1);
  });

  it("setSortBy updates sort field", () => {
    useCloudStore.getState().setSortBy("title");
    expect(useCloudStore.getState().sortBy).toBe("title");
  });

  it("toggleSortDir toggles direction", () => {
    expect(useCloudStore.getState().sortDir).toBe("desc");
    useCloudStore.getState().toggleSortDir();
    expect(useCloudStore.getState().sortDir).toBe("asc");
    useCloudStore.getState().toggleSortDir();
    expect(useCloudStore.getState().sortDir).toBe("desc");
  });

  it("setViewMode updates view mode", () => {
    useCloudStore.getState().setViewMode("list");
    expect(useCloudStore.getState().viewMode).toBe("list");
  });

  it("setPage updates page number", () => {
    useCloudStore.getState().setPage(5);
    expect(useCloudStore.getState().page).toBe(5);
  });

  it("clearError resets error", () => {
    useCloudStore.setState({ error: "Some error" });
    useCloudStore.getState().clearError();
    expect(useCloudStore.getState().error).toBeNull();
  });

  it("clearCurrent resets current spreadsheet", () => {
    useCloudStore.setState({
      currentSpreadsheet: {
        id: "ss-1",
        title: "Test",
        isStarred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        owner: { id: "u-1", name: "Test", email: "t@t.com", avatarUrl: null },
        sheets: [],
      },
    });
    useCloudStore.getState().clearCurrent();
    expect(useCloudStore.getState().currentSpreadsheet).toBeNull();
  });

  it("fetchSpreadsheets sets loading state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    });

    const promise = useCloudStore.getState().fetchSpreadsheets();
    expect(useCloudStore.getState().isListLoading).toBe(true);
    await promise;
    expect(useCloudStore.getState().isListLoading).toBe(false);
  });

  it("fetchSpreadsheets populates spreadsheets on success", async () => {
    const spreadsheets = [
      {
        id: "ss-1",
        title: "Budget",
        isStarred: false,
        isTemplate: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        owner: { id: "u-1", name: "Test", avatarUrl: null },
        role: "owner",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: spreadsheets,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    });

    await useCloudStore.getState().fetchSpreadsheets();
    const state = useCloudStore.getState();
    expect(state.spreadsheets).toHaveLength(1);
    expect(state.spreadsheets[0].title).toBe("Budget");
    expect(state.total).toBe(1);
  });

  it("fetchSpreadsheet sets error on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: { code: 404, message: "Spreadsheet not found" },
      }),
    });

    await expect(
      useCloudStore.getState().fetchSpreadsheet("nonexistent"),
    ).rejects.toThrow();

    const state = useCloudStore.getState();
    expect(state.error).toBe("Spreadsheet not found");
    expect(state.isLoading).toBe(false);
  });

  it("createSpreadsheet adds to list", async () => {
    const newSpreadsheet = {
      id: "ss-new",
      title: "New Sheet",
      isStarred: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      owner: { id: "u-1", name: "Test", email: "t@t.com", avatarUrl: null },
      sheets: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: newSpreadsheet }),
    });

    const result = await useCloudStore
      .getState()
      .createSpreadsheet("New Sheet");
    expect(result.id).toBe("ss-new");
    expect(useCloudStore.getState().spreadsheets[0].id).toBe("ss-new");
  });

  it("deleteSpreadsheet removes from list", async () => {
    useCloudStore.setState({
      spreadsheets: [
        {
          id: "ss-1",
          title: "Budget",
          isStarred: false,
          isTemplate: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          owner: { id: "u-1", name: "Test", avatarUrl: null },
          role: "owner",
        },
      ],
      total: 1,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await useCloudStore.getState().deleteSpreadsheet("ss-1");
    expect(useCloudStore.getState().spreadsheets).toHaveLength(0);
    expect(useCloudStore.getState().total).toBe(0);
  });

  it("saveSheetData sets save status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { updatedAt: "2026-01-01" },
      }),
    });

    await useCloudStore
      .getState()
      .saveSheetData("ss-1", "sheet-1", { A1: { value: "test" } });
    expect(useCloudStore.getState().saveStatus).toBe("saved");
  });
});
