import {
  useEffect,
  useState,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCloudStore } from "../../stores/cloudStore";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { useSharingStore } from "../../stores/sharingStore";
import { Grid } from "../grid";
import { MenuBar } from "../ui/MenuBar";
import { FormulaBar } from "../formula-bar/FormulaBar";
import { Toolbar, MobileToolbar } from "../toolbar";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { SheetTabs } from "../sheets/SheetTabs";
import { StatusBar } from "../ui/StatusBar";
import { ZoomControls } from "../ui/ZoomControls";
import { FindReplace } from "../data/FindReplace";
import { FilterViewBar } from "../data/FilterViewBar";
import { CommandPalette } from "../ui/CommandPalette";
import { PasteSpecialDialog } from "../ui/PasteSpecialDialog";
import { PrintDialog } from "../ui/PrintDialog";
import { FormatCellsDialog } from "../ui/FormatCellsDialog";
import { HyperlinkDialog } from "../ui/HyperlinkDialog";
import { ImageDialog } from "../ui/ImageDialog";
import { EmailDialog } from "../ui/EmailDialog";
import { CommentsSidebar } from "../ui/CommentsSidebar";
import { OfflineIndicator } from "../ui/OfflineIndicator";
import { ConnectionStatus } from "../realtime/ConnectionStatus";
import { CollaboratorAvatars } from "../realtime/CollaboratorAvatars";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { ShareDialog } from "../sharing/ShareDialog";
import { BandedRowsDialog } from "../data/BandedRowsDialog";
import { ConditionalFormatManager } from "../data/ConditionalFormatManager";
import { ProtectionDialog } from "../data/ProtectionDialog";
import { RemoveDuplicatesDialog } from "../data/RemoveDuplicatesDialog";
import { TextToColumnsDialog } from "../data/TextToColumnsDialog";
import { GoalSeekDialog } from "../data/GoalSeekDialog";
import { SlicerControl } from "../data/SlicerControl";
import { useViewStore } from "../../stores/viewStore";
import { ViewSwitcher, KanbanView, TimelineView, CalendarView } from "../views";
import { MacroRecorderBar } from "../macros/MacroRecorderBar";
import { MacroManagerDialog } from "../macros/MacroManagerDialog";
import { ScriptEditor } from "../macros/ScriptEditor";
import { NamedFunctionsDialog } from "../ui/NamedFunctionsDialog";
import { AIAnalysisPanel } from "../data/AIAnalysisPanel";
import { KeyboardShortcutsDialog } from "../ui/KeyboardShortcutsDialog";
import { ThemeSidebar } from "../ui/ThemeSidebar";
import { NotificationRulesDialog } from "../notifications/NotificationRulesDialog";
import { ImportDialog } from "../file-ops/ImportDialog";
import { DetailsDialog } from "../ui/DetailsDialog";
import { SuggestionsSidebar } from "../suggestions/SuggestionsSidebar";
import { useMacroRecorder } from "../../hooks/useMacroRecorder";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useHydrateFromServer } from "../../hooks/useHydrateFromServer";
import { useRealtimeConnection } from "../../hooks/useRealtimeConnection";
import { useRealtimeSync } from "../../hooks/useRealtimeSync";
import { useCommentStore } from "../../stores/commentStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { SaveIndicator } from "./SaveIndicator";
import { SpreadsheetLoader } from "./SpreadsheetLoader";

const ChartOverlay = lazy(() =>
  import("../charts/ChartOverlay").then((m) => ({ default: m.ChartOverlay })),
);
const VersionHistorySidebar = lazy(() =>
  import("../versions/VersionHistorySidebar").then((m) => ({
    default: m.VersionHistorySidebar,
  })),
);

function KeyboardShortcutsWrapper() {
  const isOpen = useUIStore((s) => s.isKeyboardShortcutsOpen);
  const close = useUIStore((s) => s.setKeyboardShortcutsOpen);
  return (
    <KeyboardShortcutsDialog isOpen={isOpen} onClose={() => close(false)} />
  );
}

/* ThemeDialogWrapper removed — ThemeSidebar is rendered in sidebar area */

function BandedRowsDialogWrapper() {
  const isOpen = useUIStore((s) => s.isBandedRowsDialogOpen);
  const close = useUIStore((s) => s.setBandedRowsDialogOpen);
  return <BandedRowsDialog isOpen={isOpen} onClose={() => close(false)} />;
}

function ConditionalFormatWrapper() {
  const isOpen = useUIStore((s) => s.isConditionalFormatOpen);
  const close = useUIStore((s) => s.setConditionalFormatOpen);
  return (
    <ConditionalFormatManager open={isOpen} onClose={() => close(false)} />
  );
}

function TitleBarCommentIcon() {
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const commentCount = useCommentStore(
    (s) => s.comments.get(activeSheetId)?.length ?? 0,
  );
  const openPanel = useCommentStore((s) => s.openPanel);

  return (
    <button
      data-testid="titlebar-comment-icon"
      className="relative rounded-full p-1.5 hover:bg-gray-100 transition-colors"
      style={{ padding: "6px" }}
      onClick={openPanel}
      title="Open comments"
      type="button"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#5f6368"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {commentCount > 0 && (
        <span
          data-testid="comment-count-badge"
          className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1a73e8] px-1 text-[10px] font-medium text-white"
        >
          {commentCount}
        </span>
      )}
    </button>
  );
}

function UserAvatar() {
  const user = useAuthStore((s) => s.user);
  const initials = user
    ? (user.name ?? user.email ?? "U")
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div
      data-testid="user-avatar"
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white text-xs font-medium cursor-pointer"
      style={{ width: "32px", height: "32px", fontSize: "13px" }}
      title={user?.name ?? user?.email ?? "User"}
    >
      {initials}
    </div>
  );
}

function ToolbarWithCollapse() {
  const isCollapsed = useUIStore((s) => s.isToolbarCollapsed);
  const toggleCollapsed = useUIStore((s) => s.toggleToolbarCollapsed);

  if (isCollapsed) {
    return (
      <div
        className="flex items-center justify-end bg-[#f3f3f3] border-b border-gray-200 px-2"
        style={{ padding: "2px 8px" }}
        data-testid="toolbar-collapsed"
      >
        <button
          data-testid="toolbar-expand-chevron"
          className="h-5 w-7 flex items-center justify-center rounded-sm hover:bg-gray-200"
          onClick={toggleCollapsed}
          title="Show toolbar"
          type="button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    );
  }

  return <Toolbar />;
}

export default function SpreadsheetEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentSpreadsheet = useCloudStore((s) => s.currentSpreadsheet);
  const isLoading = useCloudStore((s) => s.isLoading);
  const error = useCloudStore((s) => s.error);
  const fetchSpreadsheet = useCloudStore((s) => s.fetchSpreadsheet);
  const updateSpreadsheet = useCloudStore((s) => s.updateSpreadsheet);
  const clearCurrent = useCloudStore((s) => s.clearCurrent);
  const toggleStar = useCloudStore((s) => s.toggleStar);

  const showFormulaBar = useUIStore((s) => s.showFormulaBar);
  const user = useAuthStore((s) => s.user);
  const openShareDialog = useSharingStore((s) => s.openDialog);
  const activeView = useViewStore((s) => s.activeView);
  const isMobile = useIsMobile();

  useMacroRecorder();
  useHydrateFromServer();
  useAutoSave(id);
  useRealtimeConnection(id);
  useRealtimeSync(id);

  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const loadedRef = useRef(false);
  // Store navigate in a ref to avoid it destabilizing the useEffect dependency array.
  // React Router v7's useNavigate() may return a new reference on each render.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (id && !loadedRef.current) {
      loadedRef.current = true;
      fetchSpreadsheet(id).catch(() => {
        navigateRef.current("/not-found", { replace: true });
      });
    }

    return () => {
      clearCurrent();
      loadedRef.current = false;
    };
  }, [id, fetchSpreadsheet, clearCurrent]);

  const handleRename = useCallback(async () => {
    if (id && titleInput.trim() && titleInput !== currentSpreadsheet?.title) {
      await updateSpreadsheet(id, { title: titleInput.trim() });
    }
    setIsRenaming(false);
  }, [id, titleInput, currentSpreadsheet?.title, updateSpreadsheet]);

  const handleShare = useCallback(() => {
    if (id) openShareDialog(id);
  }, [id, openShareDialog]);

  const handleToggleStar = useCallback(() => {
    if (id) toggleStar(id);
  }, [id, toggleStar]);

  if (isLoading && !currentSpreadsheet) {
    return <SpreadsheetLoader />;
  }

  if (error && !currentSpreadsheet) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="spreadsheet-error"
      >
        <div className="text-center">
          <p className="mb-2 text-sm text-red-500">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentSpreadsheet) {
    return <SpreadsheetLoader />;
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-white"
      data-testid="spreadsheet-editor"
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 bg-white px-4 py-2 border-b border-gray-100"
        style={{ padding: "8px 16px", gap: "12px" }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex-shrink-0"
          style={{ padding: "4px" }}
          data-testid="back-to-dashboard"
          title="Back to dashboard"
        >
          <svg
            className="h-6 w-6 text-[#0F9D58]"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "24px", height: "24px" }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" opacity="0.5" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          {isRenaming ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              autoFocus
              className="rounded border border-blue-400 px-2 py-0.5 text-base font-medium outline-none"
              style={{ padding: "2px 8px", fontSize: "16px" }}
              data-testid="editor-title-input"
            />
          ) : (
            <h2
              className="cursor-pointer truncate text-base font-medium text-gray-800 hover:text-gray-600"
              style={{ fontSize: "16px", lineHeight: "24px" }}
              onClick={() => {
                setTitleInput(currentSpreadsheet.title);
                setIsRenaming(true);
              }}
              data-testid="editor-title"
            >
              {currentSpreadsheet.title}
            </h2>
          )}

          <button
            onClick={handleToggleStar}
            className="rounded p-1 hover:bg-gray-100 flex-shrink-0"
            style={{ padding: "4px" }}
            data-testid="star-toggle"
            title={
              currentSpreadsheet.isStarred
                ? "Remove from starred"
                : "Add to starred"
            }
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill={currentSpreadsheet.isStarred ? "#FBBC04" : "none"}
              stroke={currentSpreadsheet.isStarred ? "#FBBC04" : "#9CA3AF"}
              strokeWidth="2"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>

          <SaveIndicator />
        </div>

        <div
          className="ml-auto flex items-center gap-3"
          style={{ gap: "12px" }}
        >
          <ConnectionStatus />
          <CollaboratorAvatars />
          <TitleBarCommentIcon />
          <button
            onClick={handleShare}
            className="rounded-full bg-[#1a73e8] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#1765cc] transition-colors shadow-sm"
            style={{ padding: "6px 20px", fontSize: "14px" }}
            data-testid="share-button"
          >
            Share
          </button>
          <NotificationCenter />
          <UserAvatar />
        </div>
      </div>

      {/* Macro recording bar */}
      <MacroRecorderBar />

      {/* Menu bar — hidden on mobile */}
      {!isMobile && <MenuBar />}

      {/* Toolbar — collapses on mobile, collapsible via chevron */}
      {isMobile ? <MobileToolbar /> : <ToolbarWithCollapse />}

      {/* Formula bar */}
      {showFormulaBar && <FormulaBar />}

      {/* Filter view indicator bar */}
      <FilterViewBar />

      {/* View switcher */}
      <ViewSwitcher />

      {/* Main content area: grid/views + sidebars */}
      <div
        className="relative flex flex-1 overflow-hidden"
        data-testid="grid-wrapper"
      >
        <div className="flex-1 overflow-hidden">
          {activeView === "grid" && <Grid />}
          {activeView === "kanban" && <KanbanView />}
          {activeView === "timeline" && <TimelineView />}
          {activeView === "calendar" && <CalendarView />}
        </div>

        {/* Sidebars render beside the grid */}
        <Suspense fallback={null}>
          <VersionHistorySidebar spreadsheetId={id ?? ""} />
        </Suspense>
        <CommentsSidebar currentUserId={user?.id} />
        <AIAnalysisPanel />
        <SuggestionsSidebar />
        <ThemeSidebar />
      </div>

      {/* Sheet tabs */}
      <SheetTabs />

      {/* Status bar + zoom */}
      <div
        className="flex h-7 items-center border-t border-gray-200 bg-[#f8f9fa]"
        style={{ height: "28px" }}
      >
        <div className="flex flex-1 items-center justify-end">
          <StatusBar />
        </div>
        <ZoomControls />
      </div>

      {/* Overlays — all self-manage visibility via stores */}
      <FindReplace />
      <CommandPalette />
      <PasteSpecialDialog />
      <PrintDialog />
      <FormatCellsDialog />
      <HyperlinkDialog />
      <ImageDialog />
      <EmailDialog />
      <ShareDialog spreadsheetId={id ?? ""} />
      <BandedRowsDialogWrapper />
      <ConditionalFormatWrapper />
      <ProtectionDialog />
      <RemoveDuplicatesDialog />
      <TextToColumnsDialog />
      <GoalSeekDialog />
      <SlicerControl />
      <MacroManagerDialog />
      <ScriptEditor />
      <NamedFunctionsDialog />
      <KeyboardShortcutsWrapper />

      <NotificationRulesDialog />
      <ImportDialog />
      <DetailsDialog />
      <OfflineIndicator />
      <Suspense fallback={null}>
        <ChartOverlay />
      </Suspense>
    </div>
  );
}
