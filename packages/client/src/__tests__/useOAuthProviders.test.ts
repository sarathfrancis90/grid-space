import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOAuthProviders } from "../hooks/useOAuthProviders";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useOAuthProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to both providers disabled", () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useOAuthProviders());
    expect(result.current).toEqual({ google: false, github: false });
  });

  it("returns provider availability from API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { google: true, github: false },
      }),
    });

    const { result } = renderHook(() => useOAuthProviders());

    await waitFor(() => {
      expect(result.current).toEqual({ google: true, github: false });
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/oauth/providers");
  });

  it("keeps defaults when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useOAuthProviders());

    // Wait a tick to let the effect run
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(result.current).toEqual({ google: false, github: false });
  });

  it("keeps defaults when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useOAuthProviders());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(result.current).toEqual({ google: false, github: false });
  });
});
