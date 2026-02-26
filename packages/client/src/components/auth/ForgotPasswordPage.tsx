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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <GridSpaceLogo size={36} />
            <span className="text-2xl font-bold text-[#1a73e8]">GridSpace</span>
          </div>
          <h1
            className="text-xl font-semibold text-gray-900"
            data-testid="forgot-title"
          >
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="text-center" data-testid="forgot-success">
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              If an account with that email exists, we&apos;ve sent a reset
              link.
            </div>
            <Link to="/login" className="text-[#1a73e8] hover:text-[#1765cc]">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                data-testid="forgot-error"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="forgot-email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                data-testid="forgot-submit"
                className="w-full rounded-md bg-[#1a73e8] px-4 py-2 text-white font-medium transition-colors hover:bg-[#1765cc] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link
                to="/login"
                className="text-[#1a73e8] hover:text-[#1765cc]"
                data-testid="forgot-login-link"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">Powered by GridSpace</p>
    </div>
  );
}
