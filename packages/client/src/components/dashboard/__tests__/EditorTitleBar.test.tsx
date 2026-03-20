/**
 * EditorTitleBar — Tests for the editor title bar UI elements
 * Issue #196: match Google Sheets editor title bar
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SpreadsheetEditorPage from "../SpreadsheetEditorPage";
import { useCloudStore } from "../../../stores/cloudStore";
import { useAuthStore } from "../../../stores/authStore";

// Mock all the heavy dependencies to keep the test focused
vi.mock("../../grid", () => ({ Grid: () => <div data-testid="grid" /> }));
vi.mock("../../toolbar", () => ({
  Toolbar: () => <div />,
  MobileToolbar: () => <div />,
}));
vi.mock("../../formula-bar/FormulaBar", () => ({
  FormulaBar: () => <div />,
}));
vi.mock("../../sheets/SheetTabs", () => ({
  SheetTabs: () => <div />,
}));
vi.mock("../../ui/StatusBar", () => ({ StatusBar: () => <div /> }));
vi.mock("../../ui/ZoomControls", () => ({ ZoomControls: () => <div /> }));
vi.mock("../../ui/MenuBar", () => ({ MenuBar: () => <div /> }));
vi.mock("../../data/FindReplace", () => ({ FindReplace: () => null }));
vi.mock("../../data/FilterViewBar", () => ({ FilterViewBar: () => null }));
vi.mock("../../ui/CommandPalette", () => ({ CommandPalette: () => null }));
vi.mock("../../ui/PasteSpecialDialog", () => ({
  PasteSpecialDialog: () => null,
}));
vi.mock("../../ui/PrintDialog", () => ({ PrintDialog: () => null }));
vi.mock("../../ui/FormatCellsDialog", () => ({
  FormatCellsDialog: () => null,
}));
vi.mock("../../ui/HyperlinkDialog", () => ({ HyperlinkDialog: () => null }));
vi.mock("../../ui/ImageDialog", () => ({ ImageDialog: () => null }));
vi.mock("../../ui/DrawingDialog", () => ({ DrawingDialog: () => null }));
vi.mock("../../ui/EmailDialog", () => ({ EmailDialog: () => null }));
vi.mock("../../ui/CommentsSidebar", () => ({ CommentsSidebar: () => null }));
vi.mock("../../ui/OfflineIndicator", () => ({ OfflineIndicator: () => null }));
vi.mock("../../realtime/ConnectionStatus", () => ({
  ConnectionStatus: () => null,
}));
vi.mock("../../realtime/CollaboratorAvatars", () => ({
  CollaboratorAvatars: () => null,
}));
vi.mock("../../notifications/NotificationCenter", () => ({
  NotificationCenter: () => null,
}));
vi.mock("../../sharing/ShareDialog", () => ({ ShareDialog: () => null }));
vi.mock("../../data/BandedRowsDialog", () => ({
  BandedRowsDialog: () => null,
}));
vi.mock("../../data/ConditionalFormatManager", () => ({
  ConditionalFormatManager: () => null,
}));
vi.mock("../../data/ProtectionDialog", () => ({
  ProtectionDialog: () => null,
}));
vi.mock("../../data/RemoveDuplicatesDialog", () => ({
  RemoveDuplicatesDialog: () => null,
}));
vi.mock("../../data/TextToColumnsDialog", () => ({
  TextToColumnsDialog: () => null,
}));
vi.mock("../../data/GoalSeekDialog", () => ({ GoalSeekDialog: () => null }));
vi.mock("../../data/FillSeriesDialog", () => ({
  FillSeriesDialog: () => null,
}));
vi.mock("../../data/SlicerControl", () => ({ SlicerControl: () => null }));
vi.mock("../../macros/MacroRecorderBar", () => ({
  MacroRecorderBar: () => null,
}));
vi.mock("../../macros/MacroManagerDialog", () => ({
  MacroManagerDialog: () => null,
}));
vi.mock("../../macros/ScriptEditor", () => ({ ScriptEditor: () => null }));
vi.mock("../../ui/NamedFunctionsDialog", () => ({
  NamedFunctionsDialog: () => null,
}));
vi.mock("../../data/AIAnalysisPanel", () => ({ AIAnalysisPanel: () => null }));
vi.mock("../../ui/KeyboardShortcutsDialog", () => ({
  KeyboardShortcutsDialog: () => null,
}));
vi.mock("../../ui/AboutDialog", () => ({ AboutDialog: () => null }));
vi.mock("../../ui/WhatsNewDialog", () => ({ WhatsNewDialog: () => null }));
vi.mock("../../ui/ThemeSidebar", () => ({ ThemeSidebar: () => null }));
vi.mock("../../notifications/NotificationRulesDialog", () => ({
  NotificationRulesDialog: () => null,
}));
vi.mock("../../file-ops/ImportDialog", () => ({ ImportDialog: () => null }));
vi.mock("../../ui/DetailsDialog", () => ({ DetailsDialog: () => null }));
vi.mock("../../ui/AccessibilityDialog", () => ({
  AccessibilityDialog: () => null,
}));
vi.mock("../../ui/CreateFormDialog", () => ({ CreateFormDialog: () => null }));
vi.mock("../../suggestions/SuggestionsSidebar", () => ({
  SuggestionsSidebar: () => null,
}));
vi.mock("../../views", () => ({
  ViewSwitcher: () => null,
  KanbanView: () => null,
  TimelineView: () => null,
  CalendarView: () => null,
}));
vi.mock("../../../hooks/useMacroRecorder", () => ({
  useMacroRecorder: () => {},
}));
vi.mock("../../../hooks/useAutoSave", () => ({ useAutoSave: () => {} }));
vi.mock("../../../hooks/useHydrateFromServer", () => ({
  useHydrateFromServer: () => {},
}));
vi.mock("../../../hooks/useRealtimeConnection", () => ({
  useRealtimeConnection: () => {},
}));
vi.mock("../../../hooks/useRealtimeSync", () => ({
  useRealtimeSync: () => {},
}));
vi.mock("../../../hooks/useMediaQuery", () => ({
  useIsMobile: () => false,
}));

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={["/spreadsheet/test-id"]}>
      <Routes>
        <Route path="/spreadsheet/:id" element={<SpreadsheetEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditorTitleBar", () => {
  beforeEach(() => {
    // Set up a mock current spreadsheet
    useCloudStore.setState({
      currentSpreadsheet: {
        id: "test-id",
        title: "Test Spreadsheet",
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    });
    useAuthStore.setState({
      user: { id: "u1", name: "Test User", email: "test@example.com" },
    });
  });

  it("renders green sheets icon that links to dashboard", () => {
    renderEditor();
    const backBtn = screen.getByTestId("back-to-dashboard");
    expect(backBtn).toBeTruthy();
    // The SVG should contain a green rect
    const svg = backBtn.querySelector("svg");
    expect(svg).toBeTruthy();
    const greenRect = svg?.querySelector('rect[fill="#0F9D58"]');
    expect(greenRect).toBeTruthy();
  });

  it("renders editable title with cursor:text style", () => {
    renderEditor();
    const title = screen.getByTestId("editor-title");
    expect(title.textContent).toBe("Test Spreadsheet");
    expect(title.style.cursor).toBe("text");
  });

  it("switches to edit mode on title click", () => {
    renderEditor();
    const title = screen.getByTestId("editor-title");
    fireEvent.click(title);
    const input = screen.getByTestId("editor-title-input");
    expect(input).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe("Test Spreadsheet");
  });

  it("renders star toggle button", () => {
    renderEditor();
    const star = screen.getByTestId("star-toggle");
    expect(star).toBeTruthy();
  });

  it("renders Share button with lock icon", () => {
    renderEditor();
    const shareBtn = screen.getByTestId("share-button");
    expect(shareBtn).toBeTruthy();
    expect(shareBtn.textContent).toContain("Share");
    // Should contain lock icon SVG
    const svg = shareBtn.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("renders comment icon", () => {
    renderEditor();
    const commentIcon = screen.getByTestId("titlebar-comment-icon");
    expect(commentIcon).toBeTruthy();
  });

  it("renders user avatar", () => {
    renderEditor();
    const avatar = screen.getByTestId("user-avatar");
    expect(avatar).toBeTruthy();
    expect(avatar.textContent).toBe("TU");
  });
});
