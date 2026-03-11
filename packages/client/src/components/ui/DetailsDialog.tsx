/**
 * DetailsDialog — shows spreadsheet metadata (created, modified, owner, size).
 */
import { useUIStore } from "../../stores/uiStore";
import { useCloudStore } from "../../stores/cloudStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeSize(): string {
  const sheets = useSpreadsheetStore.getState().sheets;
  const cellStore = useCellStore.getState();
  let totalCells = 0;
  for (const sheet of sheets) {
    const cells = cellStore.cells.get(sheet.id);
    if (cells) totalCells += cells.size;
  }
  return `${totalCells} cells across ${sheets.length} sheet${sheets.length !== 1 ? "s" : ""}`;
}

export function DetailsDialog() {
  const isOpen = useUIStore((s) => s.isDetailsDialogOpen);
  const spreadsheet = useCloudStore((s) => s.currentSpreadsheet);

  if (!isOpen || !spreadsheet) return null;

  const handleClose = () => {
    useUIStore.getState().setDetailsDialogOpen(false);
  };

  const size = computeSize();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
      data-testid="details-dialog-backdrop"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="details-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Spreadsheet details
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="details-dialog-close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <DetailRow label="Title" value={spreadsheet.title} />
          <DetailRow
            label="Owner"
            value={
              spreadsheet.owner.name || spreadsheet.owner.email || "Unknown"
            }
          />
          <DetailRow
            label="Created"
            value={formatDate(spreadsheet.createdAt)}
          />
          <DetailRow
            label="Last modified"
            value={formatDate(spreadsheet.updatedAt)}
          />
          <DetailRow label="Size" value={size} />
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-3">
          <button
            onClick={handleClose}
            className="rounded-lg bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1765cc]"
            data-testid="details-dialog-ok"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-28 flex-shrink-0 text-sm font-medium text-gray-500">
        {label}
      </span>
      <span
        className="text-sm text-gray-900"
        data-testid={`details-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {value}
      </span>
    </div>
  );
}
