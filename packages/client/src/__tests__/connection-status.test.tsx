import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRealtimeStore } from "../stores/realtimeStore";
import { ConnectionStatus } from "../components/realtime/ConnectionStatus";

describe("ConnectionStatus", () => {
  beforeEach(() => {
    useRealtimeStore.getState().reset();
  });

  it("shows idle (hidden) when disconnected with no active spreadsheet", () => {
    useRealtimeStore.setState({
      connectionStatus: "disconnected",
      currentSpreadsheetId: null,
    });

    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.dataset.status).toBe("idle");
  });

  it("shows 'Offline' when disconnected with active spreadsheet", () => {
    useRealtimeStore.setState({
      connectionStatus: "disconnected",
      currentSpreadsheetId: "spreadsheet-1",
    });

    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.dataset.status).toBe("disconnected");
    expect(el.textContent).toContain("Offline");
  });

  it("shows 'Connecting…' when connecting", () => {
    useRealtimeStore.setState({
      connectionStatus: "connecting",
      currentSpreadsheetId: "spreadsheet-1",
    });

    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.dataset.status).toBe("connecting");
    expect(el.textContent).toContain("Connecting");
  });

  it("shows 'Connected' when connected", () => {
    useRealtimeStore.setState({
      connectionStatus: "connected",
      currentSpreadsheetId: "spreadsheet-1",
    });

    render(<ConnectionStatus />);
    const el = screen.getByTestId("connection-status");
    expect(el.dataset.status).toBe("connected");
    expect(el.textContent).toContain("Connected");
  });
});
