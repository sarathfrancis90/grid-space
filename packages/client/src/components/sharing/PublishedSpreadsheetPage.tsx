import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface SheetData {
  id: string;
  name: string;
  index: number;
  cellData: Record<string, Record<string, unknown>>;
  columnMeta: Record<string, { width?: number }>;
  rowMeta: Record<string, { height?: number }>;
}

interface PublishedData {
  id: string;
  title: string;
  sheets: SheetData[];
}

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 24;

function getCellValue(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object" && cell !== null) {
    const c = cell as Record<string, unknown>;
    if (c.computedValue !== undefined) return String(c.computedValue);
    if (c.value !== undefined) return String(c.value);
    return "";
  }
  return String(cell);
}

function getGridBounds(cellData: Record<string, Record<string, unknown>>): {
  maxRow: number;
  maxCol: number;
} {
  let maxRow = 0;
  let maxCol = 0;
  for (const rowKey of Object.keys(cellData)) {
    const row = parseInt(rowKey, 10);
    if (isNaN(row)) continue;
    if (row > maxRow) maxRow = row;
    const rowData = cellData[rowKey];
    if (typeof rowData !== "object" || rowData === null) continue;
    for (const colKey of Object.keys(rowData as Record<string, unknown>)) {
      const col = parseInt(colKey, 10);
      if (isNaN(col)) continue;
      if (col > maxCol) maxCol = col;
    }
  }
  return { maxRow: Math.min(maxRow, 999), maxCol: Math.min(maxCol, 25) };
}

function colLabel(col: number): string {
  let label = "";
  let n = col;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export default function PublishedSpreadsheetPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublishedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);

    fetch(`${import.meta.env.VITE_API_URL || ""}/api/published/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "This spreadsheet is not published or does not exist."
              : "Failed to load published spreadsheet.",
          );
        }
        const json = await res.json();
        return json.data as PublishedData;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
        }}
        data-testid="published-loading"
      >
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
        }}
        data-testid="published-error"
      >
        <p style={{ color: "#ef4444" }}>
          {errorMsg || "Failed to load spreadsheet."}
        </p>
      </div>
    );
  }

  const sheet = data.sheets[activeSheet];
  if (!sheet) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ color: "#6b7280" }}>No sheets available.</p>
      </div>
    );
  }

  const cellData = (sheet.cellData || {}) as Record<
    string,
    Record<string, unknown>
  >;
  const { maxRow, maxCol } = getGridBounds(cellData);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
      data-testid="published-spreadsheet"
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1
          style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}
          data-testid="published-title"
        >
          {data.title}
        </h1>
        <span
          style={{
            fontSize: "12px",
            color: "#6b7280",
            backgroundColor: "#e5e7eb",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          Published (read-only)
        </span>
      </div>

      {/* Sheet tabs */}
      {data.sheets.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            paddingLeft: "12px",
          }}
          data-testid="published-sheet-tabs"
        >
          {data.sheets.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSheet(idx)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                border: "none",
                borderBottom:
                  idx === activeSheet
                    ? "2px solid #2563eb"
                    : "2px solid transparent",
                backgroundColor: "transparent",
                color: idx === activeSheet ? "#2563eb" : "#6b7280",
                fontWeight: idx === activeSheet ? 600 : 400,
                cursor: "pointer",
              }}
              data-testid={`published-tab-${idx}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: "13px",
            minWidth: "100%",
          }}
          data-testid="published-grid"
        >
          <thead>
            <tr>
              <th
                style={{
                  width: "40px",
                  minWidth: "40px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "4px",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              />
              {Array.from({ length: maxCol + 1 }, (_, c) => (
                <th
                  key={c}
                  style={{
                    width: `${DEFAULT_COL_WIDTH}px`,
                    minWidth: `${DEFAULT_COL_WIDTH}px`,
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontWeight: 500,
                    color: "#6b7280",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  {colLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRow + 1 }, (_, r) => (
              <tr key={r}>
                <td
                  style={{
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: 500,
                    color: "#6b7280",
                    fontSize: "12px",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  {r + 1}
                </td>
                {Array.from({ length: maxCol + 1 }, (_, c) => {
                  const rowData = cellData[String(r)];
                  const cell =
                    rowData && typeof rowData === "object"
                      ? (rowData as Record<string, unknown>)[String(c)]
                      : undefined;
                  return (
                    <td
                      key={c}
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "4px 8px",
                        height: `${DEFAULT_ROW_HEIGHT}px`,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: `${DEFAULT_COL_WIDTH}px`,
                      }}
                    >
                      {getCellValue(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
