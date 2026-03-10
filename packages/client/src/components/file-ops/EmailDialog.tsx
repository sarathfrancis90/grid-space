/**
 * EmailDialog — send the current spreadsheet as an email attachment.
 * Supports PDF, XLSX, and CSV formats.
 */
import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCloudStore } from "../../stores/cloudStore";
import { api } from "../../services/api";

type AttachmentFormat = "pdf" | "xlsx" | "csv";

interface EmailFormState {
  recipients: string;
  subject: string;
  message: string;
  format: AttachmentFormat;
}

const FORMAT_LABELS: Record<AttachmentFormat, string> = {
  pdf: "PDF (.pdf)",
  xlsx: "Microsoft Excel (.xlsx)",
  csv: "Comma Separated Values (.csv)",
};

export function EmailDialog() {
  const isOpen = useUIStore((s) => s.isEmailDialogOpen);
  const spreadsheet = useCloudStore((s) => s.currentSpreadsheet);

  const [form, setForm] = useState<EmailFormState>({
    recipients: "",
    subject: "",
    message: "",
    format: "pdf",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = useCallback(() => {
    useUIStore.getState().setEmailDialogOpen(false);
    setError(null);
    setSuccess(false);
    setSending(false);
    setForm({ recipients: "", subject: "", message: "", format: "pdf" });
  }, []);

  const handleSend = useCallback(async () => {
    if (!spreadsheet) return;

    const emails = form.recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setError("Please enter at least one recipient email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.find((e) => !emailRegex.test(e));
    if (invalid) {
      setError(`Invalid email address: ${invalid}`);
      return;
    }

    if (emails.length > 10) {
      setError("Maximum 10 recipients allowed.");
      return;
    }

    setError(null);
    setSending(true);

    try {
      await api.post(`/spreadsheets/${spreadsheet.id}/email`, {
        recipients: emails,
        subject:
          form.subject.trim() || `${spreadsheet.title} — shared from GridSpace`,
        message: form.message.trim(),
        format: form.format,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [form, spreadsheet]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="email-dialog-overlay"
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        data-testid="email-dialog"
        className="bg-white rounded-lg shadow-xl w-[480px] p-6"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
        >
          Email this file
        </h2>

        {success ? (
          <div data-testid="email-success">
            <p
              className="text-sm text-green-700 bg-green-50 rounded p-3 mb-4"
              style={{
                padding: "12px",
                marginBottom: "16px",
                backgroundColor: "#f0fdf4",
                color: "#15803d",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              Email sent successfully!
            </p>
            <div
              className="flex justify-end"
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <button
                data-testid="email-done"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "4px",
                }}
                onClick={handleClose}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="space-y-3"
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  style={{
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  To
                </label>
                <input
                  data-testid="email-recipients-input"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "14px",
                  }}
                  value={form.recipients}
                  onChange={(e) =>
                    setForm({ ...form, recipients: e.target.value })
                  }
                  placeholder="email@example.com, another@example.com"
                />
                <p
                  className="text-xs text-gray-400 mt-0.5"
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginTop: "2px",
                  }}
                >
                  Separate multiple addresses with commas
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  style={{
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Subject
                </label>
                <input
                  data-testid="email-subject-input"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "14px",
                  }}
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder={
                    spreadsheet
                      ? `${spreadsheet.title} — shared from GridSpace`
                      : ""
                  }
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  style={{
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Message (optional)
                </label>
                <textarea
                  data-testid="email-message-input"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "14px",
                    resize: "none",
                  }}
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Add a message..."
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  style={{
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Attachment format
                </label>
                <select
                  data-testid="email-format-select"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    width: "100%",
                    fontSize: "14px",
                  }}
                  value={form.format}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      format: e.target.value as AttachmentFormat,
                    })
                  }
                >
                  {(Object.keys(FORMAT_LABELS) as AttachmentFormat[]).map(
                    (f) => (
                      <option key={f} value={f}>
                        {FORMAT_LABELS[f]}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            {error && (
              <p
                data-testid="email-error"
                className="text-sm text-red-600 mt-3"
                style={{
                  fontSize: "14px",
                  color: "#dc2626",
                  marginTop: "12px",
                }}
              >
                {error}
              </p>
            )}

            <div
              className="flex justify-end gap-2 mt-6"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "24px",
              }}
            >
              <button
                data-testid="email-cancel"
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
                onClick={handleClose}
                disabled={sending}
                type="button"
              >
                Cancel
              </button>
              <button
                data-testid="email-send"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "4px",
                }}
                onClick={handleSend}
                disabled={sending || !form.recipients.trim()}
                type="button"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
