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
import { Toolbar } from "../toolbar";
import { SheetTabs } from "../sheets/SheetTabs";
import { StatusBar } from "../ui/StatusBar";
import { ZoomControls } from "../ui/ZoomControls";
import { FindReplace } from "../data/FindReplace";
import { CommandPalette } from "../ui/CommandPalette";
import { PasteSpecialDialog } from "../ui/PasteSpecialDialog";
import { PrintDialog } from "../ui/PrintDialog";
import { FormatCellsDialog } from "../ui/FormatCellsDialog";
import { HyperlinkDialog } from "../ui/HyperlinkDialog";
import { ImageDialog } from "../ui/ImageDialog";
import { CommentsSidebar } from "../ui/CommentsSidebar";
import { OfflineIndicator } from "../ui/OfflineIndicator";
import { ConnectionStatus } from "../realtime/ConnectionStatus";
import { CollaboratorAvatars } from "../realtime/CollaboratorAvatars";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { ShareDialog } from "../sharing/ShareDialog";
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

export default function SpreadsheetEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentSpreadsheet,
    isLoading,
    error,
    fetchSpreadsheet,
    updateSpreadsheet,
    clearCurrent,
  } = useCloudStore();

  const showFormulaBar = useUIStore((s) => s.showFormulaBar);
  const user = useAuthStore((s) => s.user);
  const openShareDialog = useSharingStore((s) => s.openDialog);

  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const loadedRef = useRef(false);

  useEffect(() => {
    if (id && !loadedRef.current) {
      loadedRef.current = true;
      fetchSpreadsheet(id).catch(() => {
        navigate("/not-found", { replace: true });
      });
    }

    return () => {
      clearCurrent();
      loadedRef.current = false;
    };
  }, [id, fetchSpreadsheet, clearCurrent, navigate]);

  const handleRename = useCallback(async () => {
    if (id && titleInput.trim() && titleInput !== currentSpreadsheet?.title) {
      await updateSpreadsheet(id, { title: titleInput.trim() });
    }
    setIsRenaming(false);
  }, [id, titleInput, currentSpreadsheet?.title, updateSpreadsheet]);

  const handleShare = useCallback(() => {
    if (id) openShareDialog(id);
  }, [id, openShareDialog]);

  if (isLoading || error || !currentSpreadsheet) {
    return <SpreadsheetLoader />;
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-white"
      data-testid="spreadsheet-editor"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-1.5">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          data-testid="back-to-dashboard"
          title="Back to dashboard"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        <svg
          className="h-6 w-6 text-green-600"
          viewBox="0 0 24 24"
          fill="currentColor"
          data-testid="gridspace-icon"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" opacity="0.5" />
        </svg>

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
            className="rounded border border-blue-500 px-2 py-0.5 text-sm font-medium"
            data-testid="editor-title-input"
          />
        ) : (
          <h2
            className="cursor-pointer truncate text-sm font-medium text-gray-900 hover:text-blue-600"
            onClick={() => {
              setTitleInput(currentSpreadsheet.title);
              setIsRenaming(true);
            }}
            data-testid="editor-title"
          >
            {currentSpreadsheet.title}
          </h2>
        )}

        <SaveIndicator />

        <div className="ml-auto flex items-center gap-2">
          <ConnectionStatus />
          <CollaboratorAvatars />
          <button
            onClick={handleShare}
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="share-button"
          >
            Share
          </button>
          <NotificationCenter />
        </div>
      </div>

      {/* Menu bar */}
      <MenuBar />

      {/* Toolbar */}
      <Toolbar />

      {/* Formula bar */}
      {showFormulaBar && <FormulaBar />}

      {/* Main content area: grid + sidebars */}
      <div
        className="relative flex flex-1 overflow-hidden"
        data-testid="grid-wrapper"
      >
        <div className="flex-1 overflow-hidden">
          <Grid />
        </div>

        {/* Sidebars render beside the grid */}
        <Suspense fallback={null}>
          <VersionHistorySidebar spreadsheetId={id ?? ""} />
        </Suspense>
        <CommentsSidebar currentUserId={user?.id} />
      </div>

      {/* Sheet tabs */}
      <SheetTabs />

      {/* Status bar + zoom */}
      <div className="flex items-center border-t border-gray-200 bg-gray-50">
        <div className="flex-1">
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
      <ShareDialog spreadsheetId={id ?? ""} />
      <OfflineIndicator />
      <Suspense fallback={null}>
        <ChartOverlay />
      </Suspense>
    </div>
  );
}
