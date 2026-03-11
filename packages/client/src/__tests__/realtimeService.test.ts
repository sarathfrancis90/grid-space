import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRealtimeStore } from "../stores/realtimeStore";

// Capture event handlers registered by connectSocket
const eventHandlers = new Map<string, ((...args: unknown[]) => void)[]>();
const mockSocket = {
  connected: false,
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    const handlers = eventHandlers.get(event) || [];
    handlers.push(handler);
    eventHandlers.set(event, handlers);
    return mockSocket;
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock("../services/api", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));

// Must import AFTER mocks are set up
import {
  connectSocket,
  disconnectSocket,
  onConnectionError,
} from "../services/realtimeService";

function fireEvent(event: string, ...args: unknown[]) {
  const handlers = eventHandlers.get(event) || [];
  handlers.forEach((h) => h(...args));
}

describe("realtimeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
    mockSocket.connected = false;
    mockSocket.on.mockImplementation(
      (event: string, handler: (...args: unknown[]) => void) => {
        const handlers = eventHandlers.get(event) || [];
        handlers.push(handler);
        eventHandlers.set(event, handlers);
        return mockSocket;
      },
    );
    disconnectSocket();
    useRealtimeStore.getState().reset();
  });

  it("sets connectionStatus to 'connecting' on connect", () => {
    connectSocket();
    expect(useRealtimeStore.getState().connectionStatus).toBe("connecting");
  });

  it("sets connectionStatus to 'connected' on connect event", () => {
    connectSocket();
    fireEvent("connect");
    expect(useRealtimeStore.getState().connectionStatus).toBe("connected");
  });

  it("sets connectionStatus to 'disconnected' on disconnect event", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "transport close");
    expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
  });

  it("handles connect_error by setting status to disconnected", () => {
    connectSocket();
    // Status starts as "connecting"
    expect(useRealtimeStore.getState().connectionStatus).toBe("connecting");

    fireEvent("connect_error", new Error("Authentication failed"));
    expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
  });

  it("notifies error listeners on connect_error", () => {
    const errorCallback = vi.fn();
    onConnectionError(errorCallback);

    connectSocket();
    fireEvent("connect_error", new Error("Auth required"));

    expect(errorCallback).toHaveBeenCalledWith(
      expect.stringContaining("Auth required"),
    );
  });

  it("sets connectionStatus to 'connecting' on reconnect_attempt", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "transport close");
    fireEvent("reconnect_attempt");
    expect(useRealtimeStore.getState().connectionStatus).toBe("connecting");
  });

  it("sets connectionStatus to 'disconnected' on reconnect_failed", () => {
    connectSocket();
    fireEvent("reconnect_failed");
    expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
  });

  it("attempts reconnection when server disconnects", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "io server disconnect");
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it("does not attempt reconnection for client-initiated disconnect", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "io client disconnect");
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it("registers connect_error handler", () => {
    connectSocket();
    const registeredEvents = Array.from(eventHandlers.keys());
    expect(registeredEvents).toContain("connect_error");
  });

  it("registers reconnect_failed handler", () => {
    connectSocket();
    const registeredEvents = Array.from(eventHandlers.keys());
    expect(registeredEvents).toContain("reconnect_failed");
  });
});
