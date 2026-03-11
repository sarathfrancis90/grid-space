import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRealtimeStore } from "../stores/realtimeStore";

// Track registered event handlers
const eventHandlers = new Map<string, ((...args: unknown[]) => void)[]>();

const mockSocket = {
  connected: false,
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    const handlers = eventHandlers.get(event) || [];
    handlers.push(handler);
    eventHandlers.set(event, handlers);
  }),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
};

function fireEvent(event: string, ...args: unknown[]) {
  const handlers = eventHandlers.get(event) || [];
  handlers.forEach((h) => h(...args));
}

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock("../services/api", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));

// Dynamic import after mocks
const { connectSocket, disconnectSocket } = await import(
  "../services/realtimeService"
);

describe("WebSocket connection handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
    mockSocket.connected = false;
    useRealtimeStore.getState().reset();
  });

  afterEach(() => {
    disconnectSocket();
  });

  it("sets status to 'connecting' when connectSocket is called", () => {
    connectSocket();
    expect(useRealtimeStore.getState().connectionStatus).toBe("connecting");
  });

  it("sets status to 'connected' on successful connect event", () => {
    connectSocket();
    fireEvent("connect");
    expect(useRealtimeStore.getState().connectionStatus).toBe("connected");
  });

  it("sets status to 'disconnected' on disconnect event", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "transport close");
    expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
  });

  it("sets status to 'disconnected' on connect_error event", () => {
    connectSocket();
    fireEvent("connect_error", new Error("Authentication failed"));
    expect(useRealtimeStore.getState().connectionStatus).toBe("disconnected");
  });

  it("attempts manual reconnect when server forces disconnect", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "io server disconnect");
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it("does not attempt manual reconnect for transport close", () => {
    connectSocket();
    fireEvent("connect");
    fireEvent("disconnect", "transport close");
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it("sets status to 'connecting' on reconnect_attempt", () => {
    connectSocket();
    fireEvent("disconnect", "transport close");
    fireEvent("reconnect_attempt");
    expect(useRealtimeStore.getState().connectionStatus).toBe("connecting");
  });

  it("registers connect_error handler for error feedback", () => {
    connectSocket();
    const hasConnectError = eventHandlers.has("connect_error");
    expect(hasConnectError).toBe(true);
  });
});
