import { useUIStore } from "../../stores/uiStore";
import { useCloudStore } from "../../stores/cloudStore";

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DetailsDialog() {
  const isOpen = useUIStore((s) => s.isDetailsDialogOpen);
  const close = useUIStore((s) => s.setDetailsDialogOpen);
  const spreadsheet = useCloudStore((s) => s.currentSpreadsheet);

  if (!isOpen || !spreadsheet) return null;

  const details = [
    { label: "Title", value: spreadsheet.title },
    {
      label: "Owner",
      value: spreadsheet.owner.name || spreadsheet.owner.email,
    },
    { label: "Created", value: formatDateTime(spreadsheet.createdAt) },
    { label: "Last modified", value: formatDateTime(spreadsheet.updatedAt) },
    { label: "Sheets", value: String(spreadsheet.sheets.length) },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={() => close(false)}
      data-testid="details-dialog-backdrop"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="details-dialog"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Spreadsheet details
          </h3>
          <button
            onClick={() => close(false)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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

        <div className="px-6 py-4">
          <dl className="space-y-3">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-4">
                <dt className="w-32 flex-shrink-0 text-sm font-medium text-gray-500">
                  {d.label}
                </dt>
                <dd
                  className="text-sm text-gray-800"
                  data-testid={`details-${d.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-3">
          <button
            onClick={() => close(false)}
            className="rounded-lg bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1765cc] transition-colors"
            data-testid="details-dialog-ok"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
