import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFolderStore } from "../stores/folderStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("folderStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useFolderStore.setState({
      folders: [],
      currentFolderId: null,
      breadcrumbs: [],
      isLoading: false,
      error: null,
    });
  });

  it("should have initial state", () => {
    const state = useFolderStore.getState();
    expect(state.folders).toEqual([]);
    expect(state.currentFolderId).toBeNull();
    expect(state.breadcrumbs).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchFolders should populate folders from API", async () => {
    const mockFolders = [
      {
        id: "f-1",
        name: "Work",
        parentId: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        _count: { children: 1, spreadsheets: 2 },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockFolders }),
    });

    await useFolderStore.getState().fetchFolders(null);

    const state = useFolderStore.getState();
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].name).toBe("Work");
    expect(state.isLoading).toBe(false);
  });

  it("fetchFolders should handle errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 500, message: "Server error" },
      }),
    });

    await useFolderStore.getState().fetchFolders(null);

    const state = useFolderStore.getState();
    expect(state.folders).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("Server error");
  });

  it("createFolder should add folder to list", async () => {
    const newFolder = {
      id: "f-new",
      name: "New",
      parentId: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      _count: { children: 0, spreadsheets: 0 },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: newFolder }),
    });

    const result = await useFolderStore.getState().createFolder("New");

    expect(result.name).toBe("New");
    const state = useFolderStore.getState();
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].id).toBe("f-new");
  });

  it("renameFolder should update folder name in list", async () => {
    useFolderStore.setState({
      folders: [
        {
          id: "f-1",
          name: "Old",
          parentId: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          _count: { children: 0, spreadsheets: 0 },
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: undefined }),
    });

    await useFolderStore.getState().renameFolder("f-1", "Renamed");

    const state = useFolderStore.getState();
    expect(state.folders[0].name).toBe("Renamed");
  });

  it("deleteFolder should remove folder from list", async () => {
    useFolderStore.setState({
      folders: [
        {
          id: "f-1",
          name: "ToDelete",
          parentId: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          _count: { children: 0, spreadsheets: 0 },
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await useFolderStore.getState().deleteFolder("f-1");

    const state = useFolderStore.getState();
    expect(state.folders).toHaveLength(0);
  });

  it("navigateToFolder should set currentFolderId", () => {
    // Mock fetch for fetchFolders and fetchBreadcrumbs calls
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [{ id: "f-1", name: "Work" }],
        }),
      });

    useFolderStore.getState().navigateToFolder("f-1");

    const state = useFolderStore.getState();
    expect(state.currentFolderId).toBe("f-1");
  });

  it("navigateToFolder(null) should clear breadcrumbs", () => {
    useFolderStore.setState({
      currentFolderId: "f-1",
      breadcrumbs: [{ id: "f-1", name: "Work" }],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    });

    useFolderStore.getState().navigateToFolder(null);

    const state = useFolderStore.getState();
    expect(state.currentFolderId).toBeNull();
    expect(state.breadcrumbs).toEqual([]);
  });

  it("clearError should reset error", () => {
    useFolderStore.setState({ error: "Some error" });
    useFolderStore.getState().clearError();
    expect(useFolderStore.getState().error).toBeNull();
  });
});
