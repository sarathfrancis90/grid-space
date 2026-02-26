import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCloudStore } from "../../stores/cloudStore";
import { Grid } from "../grid";
import { SaveIndicator } from "./SaveIndicator";
import { SpreadsheetLoader } from "./SpreadsheetLoader";

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

  if (isLoading) {
    return <SpreadsheetLoader />;
  }

  if (error || !currentSpreadsheet) {
    return <SpreadsheetLoader />;
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      data-testid="spreadsheet-editor"
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-500 hover:text-gray-700"
          data-testid="back-to-dashboard"
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
            className="rounded border border-blue-500 px-2 py-1 text-sm font-medium"
            data-testid="editor-title-input"
          />
        ) : (
          <h2
            className="cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600"
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
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden" data-testid="grid-wrapper">
        <Grid />
      </div>
    </div>
  );
}
