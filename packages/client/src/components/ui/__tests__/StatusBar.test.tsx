import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusBar } from "../StatusBar";
import { useUIStore } from "../../../stores/uiStore";
import { useRealtimeStore } from "../../../stores/realtimeStore";
import { useCellStore } from "../../../stores/cellStore";
import { useSpreadsheetStore } from "../../../stores/spreadsheetStore";

describe("StatusBar", () => {
  beforeEach(() => {
    // Reset stores
    useUIStore.setState({
      selections: [],
      zoom: 100,
      isAIAnalysisOpen: false,
    });
    useRealtimeStore.setState({
      connectedUsers: [],
      connectionStatus: "disconnected",
    });
  });

  it("renders with Ready text when no multi-cell selection", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("displays zoom percentage", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("status-bar-zoom-level")).toHaveTextContent(
      "100%",
    );
  });

  it("zoom in button increases zoom", () => {
    render(<StatusBar />);
    const zoomInBtn = screen.getByTestId("status-bar-zoom-in");
    fireEvent.click(zoomInBtn);
    expect(useUIStore.getState().zoom).toBe(110);
  });

  it("zoom out button decreases zoom", () => {
    render(<StatusBar />);
    const zoomOutBtn = screen.getByTestId("status-bar-zoom-out");
    fireEvent.click(zoomOutBtn);
    expect(useUIStore.getState().zoom).toBe(90);
  });

  it("renders Explore button that opens AI analysis", () => {
    render(<StatusBar />);
    const exploreBtn = screen.getByTestId("status-bar-explore");
    expect(exploreBtn).toBeInTheDocument();
    fireEvent.click(exploreBtn);
    expect(useUIStore.getState().isAIAnalysisOpen).toBe(true);
  });

  it("shows collaborator count when connected", () => {
    useRealtimeStore.setState({
      connectionStatus: "connected",
      connectedUsers: [
        {
          userId: "user1",
          name: "Alice",
          avatarUrl: null,
          color: "#4285F4",
          activeSheet: "sheet1",
          cursorCell: null,
          selectionRange: null,
          tabId: "tab1",
        },
        {
          userId: "user2",
          name: "Bob",
          avatarUrl: null,
          color: "#EA4335",
          activeSheet: "sheet1",
          cursorCell: null,
          selectionRange: null,
          tabId: "tab2",
        },
      ],
    });

    render(<StatusBar />);
    const collabIndicator = screen.getByTestId("status-bar-collaborators");
    expect(collabIndicator).toBeInTheDocument();
    expect(collabIndicator).toHaveTextContent("2");
  });

  it("does not show collaborator count when disconnected", () => {
    useRealtimeStore.setState({
      connectionStatus: "disconnected",
      connectedUsers: [
        {
          userId: "user1",
          name: "Alice",
          avatarUrl: null,
          color: "#4285F4",
          activeSheet: "sheet1",
          cursorCell: null,
          selectionRange: null,
          tabId: "tab1",
        },
      ],
    });

    render(<StatusBar />);
    expect(
      screen.queryByTestId("status-bar-collaborators"),
    ).not.toBeInTheDocument();
  });

  it("shows context menu on right-click with aggregation toggles", () => {
    render(<StatusBar />);
    const statusBar = screen.getByTestId("status-bar");
    fireEvent.contextMenu(statusBar);
    expect(screen.getByTestId("status-bar-context-menu")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar-toggle-sum")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar-toggle-avg")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar-toggle-count")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar-toggle-min")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar-toggle-max")).toBeInTheDocument();
  });

  it("shows aggregation stats when range is selected with data", () => {
    const sheetId = useSpreadsheetStore.getState().activeSheetId;
    const cellMap = new Map();
    cellMap.set("0,0", { value: 10 });
    cellMap.set("1,0", { value: 20 });
    cellMap.set("2,0", { value: 30 });
    useCellStore.setState({
      cells: new Map([[sheetId, cellMap]]),
    });
    useUIStore.setState({
      selections: [{ start: { row: 0, col: 0 }, end: { row: 2, col: 0 } }],
    });

    render(<StatusBar />);
    expect(screen.getByTestId("status-sum")).toHaveTextContent("SUM: 60");
    expect(screen.getByTestId("status-average")).toHaveTextContent("AVG: 20");
    expect(screen.getByTestId("status-count")).toHaveTextContent("COUNT: 3");
    expect(screen.getByTestId("status-min")).toHaveTextContent("MIN: 10");
    expect(screen.getByTestId("status-max")).toHaveTextContent("MAX: 30");
  });

  it("can toggle aggregations off via context menu", () => {
    const sheetId = useSpreadsheetStore.getState().activeSheetId;
    const cellMap = new Map();
    cellMap.set("0,0", { value: 10 });
    cellMap.set("1,0", { value: 20 });
    useCellStore.setState({
      cells: new Map([[sheetId, cellMap]]),
    });
    useUIStore.setState({
      selections: [{ start: { row: 0, col: 0 }, end: { row: 1, col: 0 } }],
    });

    render(<StatusBar />);

    // Open context menu and toggle off SUM
    const statusBar = screen.getByTestId("status-bar");
    fireEvent.contextMenu(statusBar);
    const toggleSum = screen.getByTestId("status-bar-toggle-sum");
    fireEvent.click(toggleSum);

    // SUM should no longer be visible
    expect(screen.queryByTestId("status-sum")).not.toBeInTheDocument();
    // Others should still be visible
    expect(screen.getByTestId("status-average")).toBeInTheDocument();
  });
});
