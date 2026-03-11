import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionStatus } from "../components/realtime/ConnectionStatus";
import { useRealtimeStore } from "../stores/realtimeStore";

describe("ConnectionStatus", () => {
  beforeEach(() => {
    useRealtimeStore.getState().reset();
  });

  it("renders idle state when disconnected with no active session", () => {
    // Default state: disconnected, no currentSpreadsheetId
    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.getAttribute("data-status")).toBe("idle");
    expect(el.textContent).toBe("");
  });

  it("shows 'Offline' when disconnected during an active session", () => {
    useRealtimeStore.setState({
      connectionStatus: "disconnected",
      currentSpreadsheetId: "spreadsheet-123",
    });
    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.getAttribute("data-status")).toBe("disconnected");
    expect(el.textContent).toContain("Offline");
  });

  it("shows 'Connecting...' when connecting", () => {
    useRealtimeStore.setState({
      connectionStatus: "connecting",
      currentSpreadsheetId: "spreadsheet-123",
    });
    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.getAttribute("data-status")).toBe("connecting");
  });

  it("shows 'Connected' when connected", () => {
    useRealtimeStore.setState({
      connectionStatus: "connected",
      currentSpreadsheetId: "spreadsheet-123",
    });
    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.getAttribute("data-status")).toBe("connected");
    expect(el.textContent).toContain("Connected");
  });
});
