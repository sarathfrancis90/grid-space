import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFolderStore } from "../stores/folderStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("folderStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFolderStore.setState({
      folders: [],
      currentFolderId: null,
      breadcrumbs: [],
      isLoading: false,
      error: null,
    });
  });

  it("has correct initial state", () => {
    const state = useFolderStore.getState();
    expect(state.folders).toEqual([]);
    expect(state.currentFolderId).toBeNull();
    expect(state.breadcrumbs).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchFolders populates folders on success", async () => {
    const folders = [
      {
        id: "f-1",
        name: "Projects",
        color: null,
        parentId: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "f-2",
        name: "Archive",
        color: null,
        parentId: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: folders }),
    });

    await useFolderStore.getState().fetchFolders(null);

    const state = useFolderStore.getState();
    expect(state.folders).toEqual(folders);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchFolders sets error on failure", async () => {
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

  it("createFolder adds to the list", async () => {
    const newFolder = {
      id: "f-new",
      name: "New Folder",
      color: null,
      parentId: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: newFolder }),
    });

    const result = await useFolderStore.getState().createFolder("New Folder");

    expect(result.id).toBe("f-new");
    expect(useFolderStore.getState().folders).toHaveLength(1);
    expect(useFolderStore.getState().folders[0].name).toBe("New Folder");
  });

  it("deleteFolder removes from the list", async () => {
    useFolderStore.setState({
      folders: [
        {
          id: "f-1",
          name: "Projects",
          color: null,
          parentId: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    await useFolderStore.getState().deleteFolder("f-1");

    expect(useFolderStore.getState().folders).toHaveLength(0);
  });

  it("renameFolder updates the name in the list", async () => {
    useFolderStore.setState({
      folders: [
        {
          id: "f-1",
          name: "Old Name",
          color: null,
          parentId: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} }),
    });

    await useFolderStore.getState().renameFolder("f-1", "New Name");

    expect(useFolderStore.getState().folders[0].name).toBe("New Name");
  });

  it("clearError resets error to null", () => {
    useFolderStore.setState({ error: "Some error" });
    useFolderStore.getState().clearError();
    expect(useFolderStore.getState().error).toBeNull();
  });

  it("navigateToFolder sets currentFolderId", async () => {
    // Mock fetchFolders (called by navigateToFolder)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [{ id: "bc-1", name: "Root" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      });

    await useFolderStore.getState().navigateToFolder("f-1");

    const state = useFolderStore.getState();
    expect(state.currentFolderId).toBe("f-1");
  });

  it("navigateToFolder to null clears breadcrumbs", async () => {
    useFolderStore.setState({
      breadcrumbs: [{ id: "f-1", name: "Test" }],
      currentFolderId: "f-1",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    });

    await useFolderStore.getState().navigateToFolder(null);

    const state = useFolderStore.getState();
    expect(state.currentFolderId).toBeNull();
    expect(state.breadcrumbs).toEqual([]);
  });
});
