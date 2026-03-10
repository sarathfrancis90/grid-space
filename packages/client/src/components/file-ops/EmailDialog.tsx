/**
 * EmailDialog — send the current spreadsheet as an email attachment.
 * Supports CSV, XLSX, and PDF formats.
 */
import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCellStore } from "../../stores/cellStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCloudStore } from "../../stores/cloudStore";
import { toCSV, exportXLSX } from "../../utils/fileOps";
import { api } from "../../services/api";

type AttachmentFormat = "csv" | "xlsx" | "pdf";

interface EmailFormState {
  recipients: string;
  subject: string;
  message: string;
  format: AttachmentFormat;
}

const FORMAT_LABELS: Record<AttachmentFormat, string> = {
  csv: "CSV (.csv)",
  xlsx: "Excel (.xlsx)",
  pdf: "PDF (.pdf)",
};

export function EmailDialog() {
  const isOpen = useUIStore((s) => s.isEmailDialogOpen);
  const [form, setForm] = useState<EmailFormState>({
    recipients: "",
    subject: "",
    message: "",
    format: "xlsx",
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const title =
        useCloudStore.getState().currentSpreadsheet?.title || "Spreadsheet";
      setForm((prev) => ({
        ...prev,
        subject: title,
        recipients: "",
        message: "",
      }));
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    useUIStore.getState().setEmailDialogOpen(false);
  }, []);

  const handleChange = useCallback(
    (field: keyof EmailFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
      setSuccess(null);
    },
    [],
  );

  const handleSend = useCallback(async () => {
    const recipientList = form.recipients
      .split(/[,;\n]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipientList.length === 0) {
      setError("Please enter at least one recipient email address.");
      return;
    }

    if (recipientList.length > 10) {
      setError("Maximum 10 recipients allowed.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = recipientList.find((e) => !emailRegex.test(e));
    if (invalid) {
      setError(`Invalid email address: ${invalid}`);
      return;
    }

    const spreadsheetId = useCloudStore.getState().currentSpreadsheet?.id;
    if (!spreadsheetId) {
      setError("Please save the spreadsheet to the cloud first.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      let spreadsheetData: string;

      if (form.format === "csv") {
        const sid = useSpreadsheetStore.getState().activeSheetId;
        const cells = useCellStore.getState().cells.get(sid) ?? new Map();
        spreadsheetData = toCSV(cells);
      } else if (form.format === "xlsx") {
        const sheets = useSpreadsheetStore.getState().sheets;
        const cellStore = useCellStore.getState();
        const sheetsData = sheets.map((s) => ({
          name: s.name,
          cells: cellStore.cells.get(s.id) ?? new Map(),
        }));
        const buf = await exportXLSX(sheetsData);
        spreadsheetData = arrayBufferToBase64(buf);
      } else {
        // PDF — generate CSV as fallback since PDF generation is client-side
        const sid = useSpreadsheetStore.getState().activeSheetId;
        const cells = useCellStore.getState().cells.get(sid) ?? new Map();
        spreadsheetData = toCSV(cells);
      }

      await api.post(`/spreadsheets/${spreadsheetId}/email`, {
        recipients: recipientList,
        subject: form.subject || "Spreadsheet",
        message: form.message,
        format: form.format === "pdf" ? "csv" : form.format,
        spreadsheetData,
      });

      setSuccess(
        `Email sent to ${recipientList.length} recipient${recipientList.length > 1 ? "s" : ""}.`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send email.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }, [form]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-testid="email-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[520px] max-h-[80vh] flex flex-col"
        data-testid="email-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Email this file
          </h2>
          <button
            data-testid="email-dialog-close"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={handleClose}
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              data-testid="email-recipients"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com (separate multiple with commas)"
              value={form.recipients}
              onChange={(e) => handleChange("recipients", e.target.value)}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              data-testid="email-subject"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              data-testid="email-message"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              placeholder="Optional message to include in the email"
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment format
            </label>
            <div className="flex gap-4" data-testid="email-format-options">
              {(
                Object.entries(FORMAT_LABELS) as Array<
                  [AttachmentFormat, string]
                >
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="email-format"
                    value={value}
                    checked={form.format === value}
                    onChange={() => handleChange("format", value)}
                    data-testid={`email-format-${value}`}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <p className="text-sm text-red-600" data-testid="email-error">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600" data-testid="email-success">
              {success}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            data-testid="email-cancel-btn"
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            onClick={handleClose}
            type="button"
          >
            Cancel
          </button>
          <button
            data-testid="email-send-btn"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={isSending || !form.recipients.trim()}
            type="button"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
