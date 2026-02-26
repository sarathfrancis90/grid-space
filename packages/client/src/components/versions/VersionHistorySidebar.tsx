import React, { useEffect, useCallback } from "react";
import { useVersionStore } from "../../stores/versionStore";
import { VersionItem } from "./VersionItem";
import { VersionDiffView } from "./VersionDiff";

interface VersionHistorySidebarProps {
  spreadsheetId: string;
  onRestore?: () => void;
}

export const VersionHistorySidebar: React.FC<VersionHistorySidebarProps> =
  React.memo(({ spreadsheetId, onRestore }) => {
    const isOpen = useVersionStore((s) => s.isOpen);
    const isLoading = useVersionStore((s) => s.isLoading);
    const error = useVersionStore((s) => s.error);
    const groupedVersions = useVersionStore((s) => s.groupedVersions);
    const versions = useVersionStore((s) => s.versions);
    const useGrouped = useVersionStore((s) => s.useGrouped);
    const selectedVersionId = useVersionStore((s) => s.selectedVersionId);
    const previewVersion = useVersionStore((s) => s.previewVersion);
    const isPreviewLoading = useVersionStore((s) => s.isPreviewLoading);
    const isRestoring = useVersionStore((s) => s.isRestoring);
    const diffs = useVersionStore((s) => s.diffs);

    const close = useVersionStore((s) => s.close);
    const selectVersion = useVersionStore((s) => s.selectVersion);
    const restoreVersion = useVersionStore((s) => s.restoreVersion);
    const nameVersion = useVersionStore((s) => s.nameVersion);
    const copyAsSpreadsheet = useVersionStore((s) => s.copyAsSpreadsheet);
    const clearPreview = useVersionStore((s) => s.clearPreview);

    useEffect(() => {
      if (!isOpen) return;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, close]);

    const handleSelect = useCallback(
      (versionId: string) => {
        selectVersion(spreadsheetId, versionId);
      },
      [spreadsheetId, selectVersion],
    );

    const handleRestore = useCallback(
      async (versionId: string) => {
        await restoreVersion(spreadsheetId, versionId);
        onRestore?.();
      },
      [spreadsheetId, restoreVersion, onRestore],
    );

    const handleName = useCallback(
      async (versionId: string, name: string) => {
        await nameVersion(spreadsheetId, versionId, name);
      },
      [spreadsheetId, nameVersion],
    );

    const handleCopy = useCallback(
      async (versionId: string) => {
        const result = await copyAsSpreadsheet(spreadsheetId, versionId);
        return result;
      },
      [spreadsheetId, copyAsSpreadsheet],
    );

    if (!isOpen) return null;

    const allVersions = useGrouped
      ? groupedVersions.flatMap((g) => g.versions)
      : versions;

    return (
      <div
        data-testid="version-history-sidebar"
        className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Version history
          </h2>
          <button
            data-testid="version-history-close"
            onClick={close}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close version history"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {selectedVersionId && previewVersion && (
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">
                Previewing version
              </span>
              <div className="flex gap-2">
                <button
                  data-testid="version-restore-btn"
                  onClick={() => handleRestore(selectedVersionId)}
                  disabled={isRestoring}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isRestoring ? "Restoring..." : "Restore"}
                </button>
                <button
                  data-testid="version-back-btn"
                  onClick={clearPreview}
                  className="text-xs px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div
              data-testid="version-loading"
              className="flex items-center justify-center p-8"
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="ml-2 text-sm text-gray-500">
                Loading versions...
              </span>
            </div>
          )}

          {!isLoading && allVersions.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No versions yet. Versions are created when you save.
            </div>
          )}

          {!isLoading && selectedVersionId && diffs.length > 0 && (
            <VersionDiffView diffs={diffs} />
          )}

          {!isLoading && isPreviewLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="ml-2 text-xs text-gray-500">
                Loading preview...
              </span>
            </div>
          )}

          {!isLoading && useGrouped
            ? groupedVersions.map((group) => (
                <div key={group.period}>
                  <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    {group.period}
                  </div>
                  {group.versions.map((v) => (
                    <VersionItem
                      key={v.id}
                      version={v}
                      isSelected={v.id === selectedVersionId}
                      onSelect={handleSelect}
                      onRestore={handleRestore}
                      onName={handleName}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              ))
            : !isLoading &&
              versions.map((v) => (
                <VersionItem
                  key={v.id}
                  version={v}
                  isSelected={v.id === selectedVersionId}
                  onSelect={handleSelect}
                  onRestore={handleRestore}
                  onName={handleName}
                  onCopy={handleCopy}
                />
              ))}
        </div>
      </div>
    );
  });

VersionHistorySidebar.displayName = "VersionHistorySidebar";
