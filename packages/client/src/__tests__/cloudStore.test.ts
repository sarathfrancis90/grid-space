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
      trashItems: [],
      isTrashLoading: false,
      trashPage: 1,
      trashTotalPages: 1,
      trashTotal: 0,
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

  it("saveSheetData updates currentSpreadsheet updatedAt on success", async () => {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { updatedAt: "2026-01-15T12:00:00Z" },
      }),
    });

    await useCloudStore
      .getState()
      .saveSheetData("ss-1", "sheet-1", { A1: { value: "hello" } });

    const state = useCloudStore.getState();
    expect(state.saveStatus).toBe("saved");
    expect(state.currentSpreadsheet?.updatedAt).toBe("2026-01-15T12:00:00Z");
  });

  it("saveSheetData sets error status on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 500, message: "Internal error" },
      }),
    });

    await useCloudStore
      .getState()
      .saveSheetData("ss-1", "sheet-1", { A1: { value: "test" } });

    const state = useCloudStore.getState();
    expect(state.saveStatus).toBe("error");
    expect(state.isSaving).toBe(false);
  });

  it("saveSheetData sends columnMeta and rowMeta", async () => {
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
      .saveSheetData(
        "ss-1",
        "sheet-1",
        { A1: { value: "test" } },
        { "0": { width: 150 } },
        { "0": { height: 30 } },
      );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.cellData).toEqual({ A1: { value: "test" } });
    expect(body.columnMeta).toEqual({ "0": { width: 150 } });
    expect(body.rowMeta).toEqual({ "0": { height: 30 } });
  });

  describe("trash operations", () => {
    it("has correct initial trash state", () => {
      const state = useCloudStore.getState();
      expect(state.trashItems).toEqual([]);
      expect(state.isTrashLoading).toBe(false);
      expect(state.trashPage).toBe(1);
      expect(state.trashTotalPages).toBe(1);
      expect(state.trashTotal).toBe(0);
    });

    it("setTrashPage updates trash page number", () => {
      useCloudStore.getState().setTrashPage(3);
      expect(useCloudStore.getState().trashPage).toBe(3);
    });

    it("fetchTrash sets loading state and populates trash items", async () => {
      const trashItems = [
        {
          id: "ss-1",
          title: "Deleted Sheet",
          deletedAt: "2026-03-01T00:00:00Z",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          owner: { id: "u-1", name: "Test", avatarUrl: null },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: trashItems,
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });

      const promise = useCloudStore.getState().fetchTrash();
      expect(useCloudStore.getState().isTrashLoading).toBe(true);
      await promise;

      const state = useCloudStore.getState();
      expect(state.isTrashLoading).toBe(false);
      expect(state.trashItems).toHaveLength(1);
      expect(state.trashItems[0].title).toBe("Deleted Sheet");
      expect(state.trashTotal).toBe(1);
    });

    it("restoreSpreadsheet removes item from trash", async () => {
      useCloudStore.setState({
        trashItems: [
          {
            id: "ss-1",
            title: "Deleted Sheet",
            deletedAt: "2026-03-01T00:00:00Z",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
            owner: { id: "u-1", name: "Test", avatarUrl: null },
          },
        ],
        trashTotal: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { restored: true },
        }),
      });

      await useCloudStore.getState().restoreSpreadsheet("ss-1");
      expect(useCloudStore.getState().trashItems).toHaveLength(0);
      expect(useCloudStore.getState().trashTotal).toBe(0);
    });

    it("permanentDeleteSpreadsheet removes item from trash", async () => {
      useCloudStore.setState({
        trashItems: [
          {
            id: "ss-1",
            title: "Deleted Sheet",
            deletedAt: "2026-03-01T00:00:00Z",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
            owner: { id: "u-1", name: "Test", avatarUrl: null },
          },
        ],
        trashTotal: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await useCloudStore.getState().permanentDeleteSpreadsheet("ss-1");
      expect(useCloudStore.getState().trashItems).toHaveLength(0);
      expect(useCloudStore.getState().trashTotal).toBe(0);
    });

    it("emptyTrash clears all trash items", async () => {
      useCloudStore.setState({
        trashItems: [
          {
            id: "ss-1",
            title: "Deleted 1",
            deletedAt: "2026-03-01T00:00:00Z",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
            owner: { id: "u-1", name: "Test", avatarUrl: null },
          },
          {
            id: "ss-2",
            title: "Deleted 2",
            deletedAt: "2026-03-02T00:00:00Z",
            createdAt: "2026-01-02",
            updatedAt: "2026-01-02",
            owner: { id: "u-1", name: "Test", avatarUrl: null },
          },
        ],
        trashTotal: 2,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await useCloudStore.getState().emptyTrash();
      const state = useCloudStore.getState();
      expect(state.trashItems).toHaveLength(0);
      expect(state.trashTotal).toBe(0);
      expect(state.trashPage).toBe(1);
    });

    it("deleteSpreadsheet moves item from list (soft delete)", async () => {
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
  });
});
