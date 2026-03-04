import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSharingStore } from "../stores/sharingStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("sharingStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSharingStore.setState({
      collaborators: [],
      shareLink: { shareLink: null, shareLinkRole: null },
      isLoading: false,
      isDialogOpen: false,
      error: null,
    });
  });

  it("has correct initial state", () => {
    const state = useSharingStore.getState();
    expect(state.collaborators).toEqual([]);
    expect(state.shareLink.shareLink).toBeNull();
    expect(state.isDialogOpen).toBe(false);
    expect(state.error).toBeNull();
  });

  it("openDialog sets isDialogOpen and spreadsheetId", () => {
    useSharingStore.getState().openDialog("ss-1");
    expect(useSharingStore.getState().isDialogOpen).toBe(true);
  });

  it("closeDialog sets isDialogOpen to false", () => {
    useSharingStore.setState({ isDialogOpen: true });
    useSharingStore.getState().closeDialog();
    expect(useSharingStore.getState().isDialogOpen).toBe(false);
  });

  it("fetchCollaborators loads collaborators", async () => {
    const collaborators = [
      {
        id: "access-1",
        userId: "user-1",
        role: "owner",
        createdAt: "2026-01-01",
        user: {
          id: "user-1",
          name: "Owner",
          email: "owner@test.com",
          avatarUrl: null,
        },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: collaborators }),
    });

    await useSharingStore.getState().fetchCollaborators("ss-1");
    const state = useSharingStore.getState();
    expect(state.collaborators).toHaveLength(1);
    expect(state.collaborators[0].role).toBe("owner");
    expect(state.isLoading).toBe(false);
  });

  it("addCollaborator appends to list", async () => {
    const newCollab = {
      id: "access-2",
      userId: "user-2",
      role: "editor",
      createdAt: "2026-01-01",
      user: {
        id: "user-2",
        name: "Editor",
        email: "editor@test.com",
        avatarUrl: null,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: newCollab }),
    });

    await useSharingStore
      .getState()
      .addCollaborator("ss-1", "editor@test.com", "editor");
    expect(useSharingStore.getState().collaborators).toHaveLength(1);
    expect(useSharingStore.getState().collaborators[0].role).toBe("editor");
  });

  it("removeCollaborator removes from list", async () => {
    useSharingStore.setState({
      collaborators: [
        {
          id: "access-1",
          userId: "user-2",
          role: "editor",
          createdAt: "2026-01-01",
          user: {
            id: "user-2",
            name: "Editor",
            email: "e@t.com",
            avatarUrl: null,
          },
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await useSharingStore.getState().removeCollaborator("ss-1", "user-2");
    expect(useSharingStore.getState().collaborators).toHaveLength(0);
  });

  it("createShareLink updates share link state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { shareLink: "token-abc", shareLinkRole: "viewer" },
      }),
    });

    await useSharingStore.getState().createShareLink("ss-1", "viewer");
    const state = useSharingStore.getState();
    expect(state.shareLink.shareLink).toBe("token-abc");
    expect(state.shareLink.shareLinkRole).toBe("viewer");
  });

  it("disableShareLink clears share link", async () => {
    useSharingStore.setState({
      shareLink: { shareLink: "token", shareLinkRole: "viewer" },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await useSharingStore.getState().disableShareLink("ss-1");
    const state = useSharingStore.getState();
    expect(state.shareLink.shareLink).toBeNull();
    expect(state.shareLink.shareLinkRole).toBeNull();
  });

  it("clearError resets error", () => {
    useSharingStore.setState({ error: "Some error" });
    useSharingStore.getState().clearError();
    expect(useSharingStore.getState().error).toBeNull();
  });

  it("sets error on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 500, message: "Server error" },
      }),
    });

    await useSharingStore.getState().fetchCollaborators("ss-1");
    expect(useSharingStore.getState().error).toBe("Server error");
  });
});
