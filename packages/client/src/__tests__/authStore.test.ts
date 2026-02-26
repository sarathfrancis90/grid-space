import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../stores/authStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("authStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it("has correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("login sets user and isAuthenticated on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test",
            avatarUrl: null,
            emailVerified: true,
            createdAt: "2026-01-01",
          },
          accessToken: "access-token-123",
        },
      }),
    });

    await useAuthStore.getState().login("test@example.com", "password123");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("test@example.com");
    expect(state.isLoading).toBe(false);
  });

  it("login sets error on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 401, message: "Invalid email or password" },
      }),
    });

    await expect(
      useAuthStore.getState().login("test@example.com", "wrong"),
    ).rejects.toThrow("Invalid email or password");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Invalid email or password");
  });

  it("register sets user and isAuthenticated on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user-2",
            email: "new@example.com",
            name: "New User",
            avatarUrl: null,
            emailVerified: false,
            createdAt: "2026-01-01",
          },
          accessToken: "access-token-456",
        },
      }),
    });

    await useAuthStore
      .getState()
      .register("new@example.com", "password123", "New User");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("new@example.com");
  });

  it("logout clears user and authentication", async () => {
    // Set authenticated state
    useAuthStore.setState({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        avatarUrl: null,
        emailVerified: true,
        createdAt: "2026-01-01",
      },
      isAuthenticated: true,
    });

    // Mock logout endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { message: "Logged out" } }),
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("clearError resets error state", () => {
    useAuthStore.setState({ error: "Some error" });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("setUser updates user data", () => {
    const user = {
      id: "user-1",
      email: "test@example.com",
      name: "Updated Name",
      avatarUrl: null,
      emailVerified: true,
      createdAt: "2026-01-01",
    };

    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user?.name).toBe("Updated Name");
  });
});
