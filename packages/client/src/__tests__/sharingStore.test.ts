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
      shareLink: { shareLink: null, shareLinkRole: null, expiresAt: null },
      publishInfo: { isPublished: false, publishedUrl: null },
      viewerRestrictions: {
        disableDownload: false,
        disablePrint: false,
        disableCopy: false,
      },
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
      shareLink: {
        shareLink: "token",
        shareLinkRole: "viewer",
        expiresAt: null,
      },
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

  it("has correct initial publish state", () => {
    const state = useSharingStore.getState();
    expect(state.publishInfo.isPublished).toBe(false);
    expect(state.publishInfo.publishedUrl).toBeNull();
  });

  it("fetchPublishInfo loads publish info", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { isPublished: true, publishedUrl: "abc123" },
      }),
    });

    await useSharingStore.getState().fetchPublishInfo("ss-1");
    const state = useSharingStore.getState();
    expect(state.publishInfo.isPublished).toBe(true);
    expect(state.publishInfo.publishedUrl).toBe("abc123");
  });

  it("publishToWeb sets published state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { publishedUrl: "pub-token-xyz" },
      }),
    });

    const url = await useSharingStore.getState().publishToWeb("ss-1");
    expect(url).toBe("pub-token-xyz");
    const state = useSharingStore.getState();
    expect(state.publishInfo.isPublished).toBe(true);
    expect(state.publishInfo.publishedUrl).toBe("pub-token-xyz");
  });

  it("unpublishFromWeb clears published state", async () => {
    useSharingStore.setState({
      publishInfo: { isPublished: true, publishedUrl: "some-token" },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await useSharingStore.getState().unpublishFromWeb("ss-1");
    const state = useSharingStore.getState();
    expect(state.publishInfo.isPublished).toBe(false);
    expect(state.publishInfo.publishedUrl).toBeNull();
  });

  it("transferOwnership updates collaborator roles", async () => {
    useSharingStore.setState({
      collaborators: [
        {
          id: "a1",
          userId: "owner-1",
          role: "owner",
          createdAt: "2026-01-01",
          user: {
            id: "owner-1",
            name: "Owner",
            email: "owner@test.com",
            avatarUrl: null,
          },
        },
        {
          id: "a2",
          userId: "editor-1",
          role: "editor",
          createdAt: "2026-01-01",
          user: {
            id: "editor-1",
            name: "Editor",
            email: "editor@test.com",
            avatarUrl: null,
          },
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} }),
    });

    await useSharingStore.getState().transferOwnership("ss-1", "editor-1");
    const state = useSharingStore.getState();
    const prevOwner = state.collaborators.find((c) => c.userId === "owner-1");
    const newOwner = state.collaborators.find((c) => c.userId === "editor-1");
    expect(prevOwner?.role).toBe("editor");
    expect(newOwner?.role).toBe("owner");
  });

  it("updateLinkExpiration updates share link expiration", async () => {
    useSharingStore.setState({
      shareLink: {
        shareLink: "token-abc",
        shareLinkRole: "viewer",
        expiresAt: null,
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          shareLink: "token-abc",
          shareLinkRole: "viewer",
          expiresAt: "2026-04-01T00:00:00.000Z",
        },
      }),
    });

    await useSharingStore
      .getState()
      .updateLinkExpiration("ss-1", "2026-04-01T00:00:00.000Z");
    const state = useSharingStore.getState();
    expect(state.shareLink.expiresAt).toBe("2026-04-01T00:00:00.000Z");
  });

  it("has correct initial viewer restrictions", () => {
    const state = useSharingStore.getState();
    expect(state.viewerRestrictions.disableDownload).toBe(false);
    expect(state.viewerRestrictions.disablePrint).toBe(false);
    expect(state.viewerRestrictions.disableCopy).toBe(false);
  });

  it("fetchViewerRestrictions loads restrictions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          disableDownload: true,
          disablePrint: false,
          disableCopy: true,
        },
      }),
    });

    await useSharingStore.getState().fetchViewerRestrictions("ss-1");
    const state = useSharingStore.getState();
    expect(state.viewerRestrictions.disableDownload).toBe(true);
    expect(state.viewerRestrictions.disablePrint).toBe(false);
    expect(state.viewerRestrictions.disableCopy).toBe(true);
  });

  it("updateViewerRestrictions updates restrictions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          disableDownload: true,
          disablePrint: true,
          disableCopy: false,
        },
      }),
    });

    await useSharingStore
      .getState()
      .updateViewerRestrictions("ss-1", { disableDownload: true });
    const state = useSharingStore.getState();
    expect(state.viewerRestrictions.disableDownload).toBe(true);
    expect(state.viewerRestrictions.disablePrint).toBe(true);
  });
});
