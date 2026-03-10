/**
 * EmailDialog — send the current spreadsheet as an email attachment.
 * Supports PDF, XLSX, and CSV formats.
 */
import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCloudStore } from "../../stores/cloudStore";
import { api } from "../../services/api";

type AttachmentFormat = "pdf" | "xlsx" | "csv";

interface EmailSendPayload {
  recipients: string[];
  subject: string;
  message: string;
  format: AttachmentFormat;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EmailDialog() {
  const isOpen = useUIStore((s) => s.isEmailDialogOpen);
  const spreadsheet = useCloudStore((s) => s.currentSpreadsheet);

  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<AttachmentFormat>("pdf");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = useCallback(() => {
    useUIStore.getState().setEmailDialogOpen(false);
    setRecipients("");
    setSubject("");
    setMessage("");
    setFormat("pdf");
    setError(null);
    setSuccess(false);
    setSending(false);
  }, []);

  const handleSend = useCallback(async () => {
    setError(null);
    setSuccess(false);

    const recipientList = recipients
      .split(/[,;\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipientList.length === 0) {
      setError("Please enter at least one recipient email.");
      return;
    }

    const invalid = recipientList.filter((r) => !isValidEmail(r));
    if (invalid.length > 0) {
      setError(`Invalid email address: ${invalid[0]}`);
      return;
    }

    if (!spreadsheet?.id) {
      setError("No spreadsheet is currently open.");
      return;
    }

    const payload: EmailSendPayload = {
      recipients: recipientList,
      subject: subject.trim() || `${spreadsheet.title ?? "Spreadsheet"}`,
      message: message.trim(),
      format,
    };

    setSending(true);
    try {
      await api.post(`/spreadsheets/${spreadsheet.id}/email`, payload);
      setSuccess(true);
      setTimeout(() => handleClose(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send email.";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [recipients, subject, message, format, spreadsheet, handleClose]);

  if (!isOpen) return null;

  const defaultSubject = spreadsheet?.title ?? "Spreadsheet";

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
        className="bg-white rounded-lg shadow-xl w-[440px] p-6"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "440px",
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

        <div className="space-y-3">
          {/* Recipients */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              To
            </label>
            <input
              data-testid="email-recipients"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email@example.com, another@example.com"
            />
          </div>

          {/* Subject */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Subject
            </label>
            <input
              data-testid="email-subject"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={defaultSubject}
            />
          </div>

          {/* Message */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Message
            </label>
            <textarea
              data-testid="email-message"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
                minHeight: "80px",
                resize: "vertical",
              }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional message"
              rows={3}
            />
          </div>

          {/* Attachment format */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Attach as
            </label>
            <select
              data-testid="email-format"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
              }}
              value={format}
              onChange={(e) => setFormat(e.target.value as AttachmentFormat)}
            >
              <option value="pdf">PDF (.pdf)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>
        </div>

        {/* Error / Success messages */}
        {error && (
          <p
            data-testid="email-error"
            className="mt-3 text-sm text-red-600"
            style={{ marginTop: "12px", fontSize: "14px", color: "#dc2626" }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            data-testid="email-success"
            className="mt-3 text-sm text-green-600"
            style={{ marginTop: "12px", fontSize: "14px", color: "#16a34a" }}
          >
            Email sent successfully!
          </p>
        )}

        {/* Actions */}
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
            type="button"
            disabled={sending}
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
            disabled={sending || !recipients.trim()}
            type="button"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
