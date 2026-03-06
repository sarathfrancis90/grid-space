import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRealtimeStore } from "../stores/realtimeStore";
import { useAuthStore } from "../stores/authStore";
import { useSpreadsheetStore } from "../stores/spreadsheetStore";

// Mock socket instance
const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

// Mock the realtimeService
vi.mock("../services/realtimeService", () => ({
  connectSocket: vi.fn(() => mockSocket),
  disconnectSocket: vi.fn(),
  joinSpreadsheet: vi.fn(),
  leaveSpreadsheet: vi.fn(),
}));

import { useRealtimeConnection } from "../hooks/useRealtimeConnection";
import {
  connectSocket,
  disconnectSocket,
  joinSpreadsheet,
  leaveSpreadsheet,
} from "../services/realtimeService";

describe("useRealtimeConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockReset();
    mockSocket.off.mockReset();

    // Reset stores
    useRealtimeStore.getState().reset();
  });

  afterEach(() => {
    // Reset auth store state
    useAuthStore.setState({ isAuthenticated: false });
  });

  it("does not connect when user is not authenticated", () => {
    useAuthStore.setState({ isAuthenticated: false });

    renderHook(() => useRealtimeConnection("spreadsheet-1"));

    expect(connectSocket).not.toHaveBeenCalled();
  });

  it("does not connect when spreadsheetId is undefined", () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useRealtimeConnection(undefined));

    expect(connectSocket).not.toHaveBeenCalled();
  });

  it("connects and registers listener when authenticated with spreadsheet ID", () => {
    useAuthStore.setState({ isAuthenticated: true });

    renderHook(() => useRealtimeConnection("spreadsheet-1"));

    expect(connectSocket).toHaveBeenCalledOnce();
    // Socket not connected yet, so should register a connect listener
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
  });

  it("joins spreadsheet immediately if socket already connected", () => {
    useAuthStore.setState({ isAuthenticated: true });
    mockSocket.connected = true;

    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;

    renderHook(() => useRealtimeConnection("spreadsheet-1"));

    expect(connectSocket).toHaveBeenCalledOnce();
    expect(joinSpreadsheet).toHaveBeenCalledWith(
      "spreadsheet-1",
      activeSheetId,
    );
  });

  it("joins spreadsheet when socket connect event fires", () => {
    useAuthStore.setState({ isAuthenticated: true });
    mockSocket.connected = false;

    const activeSheetId = useSpreadsheetStore.getState().activeSheetId;

    renderHook(() => useRealtimeConnection("spreadsheet-1"));

    // joinSpreadsheet not called yet since socket is not connected
    expect(joinSpreadsheet).not.toHaveBeenCalled();

    // Simulate socket connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: unknown[]) => call[0] === "connect",
    )?.[1];
    expect(connectHandler).toBeDefined();
    connectHandler!();

    expect(joinSpreadsheet).toHaveBeenCalledWith(
      "spreadsheet-1",
      activeSheetId,
    );
  });

  it("cleans up on unmount", () => {
    useAuthStore.setState({ isAuthenticated: true });

    const { unmount } = renderHook(() =>
      useRealtimeConnection("spreadsheet-1"),
    );

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith(
      "connect",
      expect.any(Function),
    );
    expect(leaveSpreadsheet).toHaveBeenCalled();
    expect(disconnectSocket).toHaveBeenCalled();
  });
});
