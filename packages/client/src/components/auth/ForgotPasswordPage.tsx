import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { GridSpaceLogo } from "../ui/GridSpaceLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4"
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        padding: "16px",
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
        style={{
          width: "100%",
          maxWidth: "448px",
          borderRadius: "12px",
          backgroundColor: "#fff",
          padding: "32px",
          boxShadow:
            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="mb-8 text-center"
          style={{ marginBottom: "32px", textAlign: "center" }}
        >
          <div
            className="mb-4 flex items-center justify-center gap-2"
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <GridSpaceLogo size={36} />
            <span
              className="text-2xl font-bold text-[#1a73e8]"
              style={{ fontSize: "24px", fontWeight: 700, color: "#1a73e8" }}
            >
              GridSpace
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}
            data-testid="forgot-title"
          >
            Reset your password
          </h1>
          <p
            className="mt-2 text-sm text-gray-500"
            style={{ marginTop: "8px", fontSize: "14px", color: "#6b7280" }}
          >
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div
            className="text-center"
            style={{ textAlign: "center" }}
            data-testid="forgot-success"
          >
            <div
              className="mb-6 flex flex-col items-center"
              style={{
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Success checkmark icon */}
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
                style={{
                  marginBottom: "16px",
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p
                className="text-sm text-gray-600"
                style={{ fontSize: "14px", color: "#4b5563" }}
              >
                If an account with that email exists, we&apos;ve sent a password
                reset link. Check your inbox.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1557b0]"
              style={{
                display: "inline-block",
                borderRadius: "8px",
                backgroundColor: "#1a73e8",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                style={{
                  marginBottom: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  padding: "12px",
                  fontSize: "14px",
                  color: "#b91c1c",
                }}
                data-testid="forgot-error"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div
                className="space-y-5"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-email"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    style={{
                      marginTop: "6px",
                      display: "block",
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#111827",
                      boxSizing: "border-box",
                    }}
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  data-testid="forgot-submit"
                  className="w-full rounded-lg bg-[#1a73e8] px-4 py-3 text-white font-semibold transition-colors hover:bg-[#1557b0] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 disabled:opacity-50"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    backgroundColor: "#1a73e8",
                    padding: "12px 16px",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "14px",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </form>

            <p
              className="mt-6 text-center text-sm text-gray-500"
              style={{
                marginTop: "24px",
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors"
                style={{
                  fontWeight: 500,
                  color: "#1a73e8",
                  textDecoration: "none",
                }}
                data-testid="forgot-login-link"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
