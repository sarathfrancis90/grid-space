import { describe, it, expect, vi, beforeEach } from "vitest";
import { useExtensionStore } from "../stores/extensionStore";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("extensionStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExtensionStore.setState({
      marketplace: [],
      installed: [],
      myExtensions: [],
      selectedExtension: null,
      isLoading: false,
      error: null,
    });
  });

  it("has correct initial state", () => {
    const state = useExtensionStore.getState();
    expect(state.marketplace).toEqual([]);
    expect(state.installed).toEqual([]);
    expect(state.myExtensions).toEqual([]);
    expect(state.selectedExtension).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchMarketplace sets loading and populates list", async () => {
    const extensions = [
      {
        id: "ext-1",
        name: "Chart Helper",
        slug: "chart-helper",
        description: "Adds chart shortcuts",
        version: "1.0.0",
        iconUrl: null,
        permissions: ["read:cells"],
        isPublished: true,
        isVerified: true,
        installCount: 42,
        author: { id: "u-1", name: "Test Author" },
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: extensions }),
    });

    const promise = useExtensionStore.getState().fetchMarketplace();
    expect(useExtensionStore.getState().isLoading).toBe(true);
    await promise;

    const state = useExtensionStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.marketplace).toHaveLength(1);
    expect(state.marketplace[0].slug).toBe("chart-helper");
  });

  it("fetchMarketplace sets error on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 500, message: "Server error" },
      }),
    });

    await useExtensionStore.getState().fetchMarketplace();

    const state = useExtensionStore.getState();
    expect(state.error).toBe("Server error");
    expect(state.isLoading).toBe(false);
  });

  it("fetchInstalled populates installed list", async () => {
    const installs = [
      {
        id: "inst-1",
        extensionId: "ext-1",
        userId: "u-1",
        isEnabled: true,
        settings: {},
        createdAt: "2026-01-01",
        extension: {
          id: "ext-1",
          name: "Chart Helper",
          slug: "chart-helper",
          description: "Adds chart shortcuts",
          version: "1.0.0",
          iconUrl: null,
          permissions: ["read:cells"],
          isPublished: true,
          isVerified: false,
          installCount: 5,
          author: { id: "u-2", name: "Dev" },
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: installs }),
    });

    await useExtensionStore.getState().fetchInstalled();

    const state = useExtensionStore.getState();
    expect(state.installed).toHaveLength(1);
    expect(state.installed[0].extension.slug).toBe("chart-helper");
  });

  it("installExtension adds to installed list", async () => {
    // Set up marketplace with one extension
    useExtensionStore.setState({
      marketplace: [
        {
          id: "ext-1",
          name: "Chart Helper",
          slug: "chart-helper",
          description: "",
          version: "1.0.0",
          iconUrl: null,
          permissions: [],
          isPublished: true,
          isVerified: false,
          installCount: 0,
          author: { id: "u-1", name: "Dev" },
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    });

    const installResult = {
      id: "inst-1",
      extensionId: "ext-1",
      userId: "u-1",
      isEnabled: true,
      settings: {},
      createdAt: "2026-01-01",
      extension: {
        id: "ext-1",
        name: "Chart Helper",
        slug: "chart-helper",
        description: "",
        version: "1.0.0",
        iconUrl: null,
        permissions: [],
        isPublished: true,
        isVerified: false,
        installCount: 1,
        author: { id: "u-1", name: "Dev" },
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: installResult }),
    });

    await useExtensionStore.getState().installExtension("chart-helper");

    const state = useExtensionStore.getState();
    expect(state.installed).toHaveLength(1);
    expect(state.marketplace[0].installCount).toBe(1);
  });

  it("uninstallExtension removes from installed list", async () => {
    useExtensionStore.setState({
      installed: [
        {
          id: "inst-1",
          extensionId: "ext-1",
          userId: "u-1",
          isEnabled: true,
          settings: {},
          createdAt: "2026-01-01",
          extension: {
            id: "ext-1",
            name: "Test",
            slug: "test-ext",
            description: "",
            version: "1.0.0",
            iconUrl: null,
            permissions: [],
            isPublished: true,
            isVerified: false,
            installCount: 5,
            author: { id: "u-2", name: "Dev" },
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({ success: true }),
    });

    await useExtensionStore.getState().uninstallExtension("test-ext");

    expect(useExtensionStore.getState().installed).toHaveLength(0);
  });

  it("toggleExtension updates isEnabled", async () => {
    useExtensionStore.setState({
      installed: [
        {
          id: "inst-1",
          extensionId: "ext-1",
          userId: "u-1",
          isEnabled: true,
          settings: {},
          createdAt: "2026-01-01",
          extension: {
            id: "ext-1",
            name: "Test",
            slug: "test-ext",
            description: "",
            version: "1.0.0",
            iconUrl: null,
            permissions: [],
            isPublished: true,
            isVerified: false,
            installCount: 1,
            author: { id: "u-2", name: "Dev" },
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: "inst-1", isEnabled: false },
      }),
    });

    await useExtensionStore.getState().toggleExtension("test-ext", false);

    expect(useExtensionStore.getState().installed[0].isEnabled).toBe(false);
  });

  it("clearError resets error", () => {
    useExtensionStore.setState({ error: "Something went wrong" });
    useExtensionStore.getState().clearError();
    expect(useExtensionStore.getState().error).toBeNull();
  });

  it("clearSelected resets selectedExtension", () => {
    useExtensionStore.setState({
      selectedExtension: {
        id: "ext-1",
        name: "Test",
        slug: "test",
        description: "",
        version: "1.0.0",
        iconUrl: null,
        permissions: [],
        isPublished: true,
        isVerified: false,
        installCount: 0,
        author: { id: "u-1", name: "Dev" },
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        entryPoint: "index.js",
        sourceCode: "",
        config: {},
      },
    });
    useExtensionStore.getState().clearSelected();
    expect(useExtensionStore.getState().selectedExtension).toBeNull();
  });

  it("fetchMyExtensions populates myExtensions", async () => {
    const myExts = [
      {
        id: "ext-1",
        name: "My Extension",
        slug: "my-extension",
        description: "My custom ext",
        version: "1.0.0",
        iconUrl: null,
        permissions: ["read:cells"],
        isPublished: false,
        isVerified: false,
        installCount: 0,
        author: { id: "u-1", name: "Me" },
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: myExts }),
    });

    await useExtensionStore.getState().fetchMyExtensions();

    const state = useExtensionStore.getState();
    expect(state.myExtensions).toHaveLength(1);
    expect(state.myExtensions[0].slug).toBe("my-extension");
  });
});
