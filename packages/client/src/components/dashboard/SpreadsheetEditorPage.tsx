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

  if (isLoading || error || !currentSpreadsheet) {
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
          <button
            onClick={handleShare}
            className="rounded-full bg-[#1a73e8] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#1765cc] transition-colors shadow-sm"
            style={{ padding: "6px 20px", fontSize: "14px" }}
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
      <ShareDialog spreadsheetId={id ?? ""} />
      <OfflineIndicator />
      <Suspense fallback={null}>
        <ChartOverlay />
      </Suspense>
    </div>
  );
}
