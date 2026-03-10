/**
 * EmailDialog — send spreadsheet as email attachment (CSV or XLSX).
 */
import { useState, useCallback } from "react";
import { useUIStore } from "../../stores/uiStore";
import { useCloudStore } from "../../stores/cloudStore";
import { api } from "../../services/api";

type AttachmentFormat = "csv" | "xlsx";

interface EmailResult {
  sent: number;
  failed: number;
}

export function EmailDialog() {
  const isOpen = useUIStore((s) => s.isEmailDialogOpen);
  const currentSpreadsheet = useCloudStore((s) => s.currentSpreadsheet);

  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<AttachmentFormat>("xlsx");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    useUIStore.getState().setEmailDialogOpen(false);
    setRecipients("");
    setSubject("");
    setMessage("");
    setFormat("xlsx");
    setError(null);
    setSuccessMsg(null);
    setSending(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!currentSpreadsheet) {
      setError("No spreadsheet is currently open");
      return;
    }

    const emailList = recipients
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emailList.length === 0) {
      setError("Please enter at least one recipient email");
      return;
    }

    if (emailList.length > 10) {
      setError("Maximum 10 recipients allowed");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emailList.find((e) => !emailRegex.test(e));
    if (invalid) {
      setError(`Invalid email address: ${invalid}`);
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setSending(true);

    try {
      const result = await api.post<EmailResult>(
        `/spreadsheets/${currentSpreadsheet.id}/email`,
        {
          recipients: emailList,
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
          format,
        },
      );

      if (result.sent > 0) {
        setSuccessMsg(
          `Email sent to ${result.sent} recipient${result.sent > 1 ? "s" : ""}${result.failed > 0 ? ` (${result.failed} failed)` : ""}`,
        );
        setTimeout(handleClose, 2000);
      } else {
        setError("Failed to send email. Please check SMTP configuration.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }, [currentSpreadsheet, recipients, subject, message, format, handleClose]);

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
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
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
              }}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email@example.com, another@example.com"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Subject (optional)
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
              }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`Sending "${currentSpreadsheet?.title ?? "Spreadsheet"}"`}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Message (optional)
            </label>
            <textarea
              data-testid="email-message-input"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "100%",
                minHeight: "64px",
                resize: "vertical",
              }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              rows={3}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ marginBottom: "4px" }}
            >
              Attachment format
            </label>
            <div
              className="flex gap-4"
              style={{ display: "flex", gap: "16px" }}
            >
              <label
                className="flex items-center gap-1.5 text-sm cursor-pointer"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <input
                  data-testid="email-format-xlsx"
                  type="radio"
                  name="email-format"
                  value="xlsx"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                />
                XLSX
              </label>
              <label
                className="flex items-center gap-1.5 text-sm cursor-pointer"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <input
                  data-testid="email-format-csv"
                  type="radio"
                  name="email-format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                />
                CSV
              </label>
            </div>
          </div>

          {error && (
            <p
              data-testid="email-error"
              className="text-sm text-red-600"
              style={{ color: "#dc2626", fontSize: "14px" }}
            >
              {error}
            </p>
          )}
          {successMsg && (
            <p
              data-testid="email-success"
              className="text-sm text-green-600"
              style={{ color: "#16a34a", fontSize: "14px" }}
            >
              {successMsg}
            </p>
          )}
        </div>

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
