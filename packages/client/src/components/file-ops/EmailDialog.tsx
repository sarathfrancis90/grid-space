/**
 * EmailDialog — Send the current spreadsheet as an email attachment.
 * Supports XLSX and CSV formats. Users can specify recipients, subject, and message.
 */
import { useState, useCallback, useEffect } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useSpreadsheetStore } from "../../stores/spreadsheetStore";
import { useCellStore } from "../../stores/cellStore";
import { api } from "../../services/api";

type AttachmentFormat = "xlsx" | "csv";

interface SendEmailPayload {
  recipients: string[];
  subject: string;
  message: string;
  format: AttachmentFormat;
  spreadsheetData: {
    sheets: Array<{
      name: string;
      cells: Record<string, { value?: string | number | boolean | null }>;
    }>;
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function EmailDialog() {
  const isOpen = useUIStore((s) => s.isEmailDialogOpen);

  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<AttachmentFormat>("xlsx");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetState = useCallback(() => {
    setRecipients("");
    setSubject("");
    setMessage("");
    setFormat("xlsx");
    setIsSending(false);
    setError(null);
    setSuccess(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const handleClose = useCallback(() => {
    useUIStore.getState().setEmailDialogOpen(false);
  }, []);

  const gatherSpreadsheetData = useCallback(() => {
    const sheets = useSpreadsheetStore.getState().sheets;
    const cellStore = useCellStore.getState();

    return sheets.map((sheet) => {
      const sheetCells = cellStore.cells.get(sheet.id);
      const cellsObj: Record<
        string,
        { value?: string | number | boolean | null }
      > = {};

      if (sheetCells) {
        for (const [key, cellData] of sheetCells) {
          cellsObj[key] = { value: cellData.value ?? null };
        }
      }

      return { name: sheet.name, cells: cellsObj };
    });
  }, []);

  const handleSend = useCallback(async () => {
    setError(null);

    const emailList = recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      setError("Please enter at least one recipient email address.");
      return;
    }

    if (emailList.length > 10) {
      setError("Maximum 10 recipients allowed.");
      return;
    }

    const invalidEmails = emailList.filter((e) => !isValidEmail(e));
    if (invalidEmails.length > 0) {
      setError(`Invalid email address: ${invalidEmails[0]}`);
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    setIsSending(true);

    try {
      const sheetsData = gatherSpreadsheetData();

      const payload: SendEmailPayload = {
        recipients: emailList,
        subject: subject.trim(),
        message: message.trim(),
        format,
        spreadsheetData: { sheets: sheetsData },
      };

      await api.post("/email", payload);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send email.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  }, [recipients, subject, message, format, gatherSpreadsheetData]);

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
          {success ? (
            <div
              className="text-center py-8"
              data-testid="email-success-message"
            >
              <div className="text-green-600 text-lg font-medium mb-2">
                Email sent successfully!
              </div>
              <p className="text-sm text-gray-500">
                Your spreadsheet has been sent to the specified recipients.
              </p>
            </div>
          ) : (
            <>
              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  data-testid="email-recipients-input"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com, another@example.com"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Separate multiple addresses with commas (max 10)
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  data-testid="email-subject-input"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Spreadsheet from GridSpace"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  data-testid="email-message-input"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachment format
                </label>
                <div className="flex gap-4" data-testid="email-format-options">
                  {(
                    [
                      ["xlsx", "Microsoft Excel (.xlsx)"],
                      ["csv", "CSV (.csv)"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="email-format"
                        value={value}
                        checked={format === value}
                        onChange={() => setFormat(value)}
                        data-testid={`email-format-${value}`}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600" data-testid="email-error">
                  {error}
                </p>
              )}
            </>
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
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button
              data-testid="email-send-btn"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSend}
              disabled={isSending}
              type="button"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
