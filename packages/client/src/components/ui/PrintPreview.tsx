import React from "react";
import { colToLetter } from "../../utils/coordinates";

interface PrintPreviewProps {
  data: Array<Array<string>>;
  pageWidth: number;
  pageHeight: number;
  showGridlines: boolean;
  showHeaders: boolean;
  scale: number;
}

const PREVIEW_MAX_WIDTH = 380;

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  data,
  pageWidth,
  pageHeight,
  showGridlines,
  showHeaders,
  scale,
}) => {
  const aspect = pageHeight / pageWidth;
  const previewWidth = PREVIEW_MAX_WIDTH;
  const previewHeight = previewWidth * aspect;
  const scaleFactor = previewWidth / pageWidth;
  const effectiveScale = (scale / 100) * scaleFactor;

  const colCount = data.length > 0 ? data[0].length : 0;
  const rowCount = data.length;
  const cellWidth =
    colCount > 0 ? Math.min(80, (pageWidth - 40) / colCount) : 80;
  const cellHeight = 18;
  const headerOffset = showHeaders ? 16 : 0;

  return (
    <div
      data-testid="print-preview"
      style={{
        width: previewWidth,
        height: previewHeight,
        backgroundColor: "white",
        border: "1px solid #d1d5db",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `scale(${effectiveScale})`,
          transformOrigin: "top left",
          padding: "20px",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Column headers */}
        {showHeaders && colCount > 0 && (
          <div style={{ display: "flex", marginLeft: 24 }}>
            {Array.from({ length: colCount }, (_, c) => (
              <div
                key={c}
                style={{
                  width: cellWidth,
                  height: headerOffset,
                  fontSize: 9,
                  textAlign: "center",
                  color: "#6b7280",
                  fontWeight: 600,
                  lineHeight: `${headerOffset}px`,
                }}
              >
                {colToLetter(c)}
              </div>
            ))}
          </div>
        )}

        {/* Rows */}
        {data.map((row, r) => (
          <div key={r} style={{ display: "flex" }}>
            {/* Row header */}
            {showHeaders && (
              <div
                style={{
                  width: 24,
                  height: cellHeight,
                  fontSize: 9,
                  textAlign: "right",
                  paddingRight: 4,
                  color: "#6b7280",
                  fontWeight: 600,
                  lineHeight: `${cellHeight}px`,
                }}
              >
                {r + 1}
              </div>
            )}

            {/* Cells */}
            {row.map((val, c) => (
              <div
                key={c}
                style={{
                  width: cellWidth,
                  height: cellHeight,
                  fontSize: 10,
                  lineHeight: `${cellHeight}px`,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingLeft: 2,
                  paddingRight: 2,
                  borderBottom: showGridlines ? "1px solid #e5e7eb" : "none",
                  borderRight: showGridlines ? "1px solid #e5e7eb" : "none",
                }}
              >
                {val}
              </div>
            ))}
          </div>
        ))}

        {/* Empty state */}
        {rowCount === 0 && (
          <div
            style={{
              color: "#9ca3af",
              fontSize: 12,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No data to preview
          </div>
        )}
      </div>
    </div>
  );
};
