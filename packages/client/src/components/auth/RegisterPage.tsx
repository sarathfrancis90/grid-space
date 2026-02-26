import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { GridSpaceLogo } from "../ui/GridSpaceLogo";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await register(email, password, name || undefined);
      navigate("/dashboard");
    } catch {
      // Error is set in the store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GridSpaceLogo size={32} />
            <span className="text-xl font-bold text-indigo-600">GridSpace</span>
          </div>
          <h1
            className="text-2xl font-bold text-gray-900"
            data-testid="register-title"
          >
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Start using GridSpace for free
          </p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            data-testid="register-error"
            onClick={clearError}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="register-name"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Your name"
            />
          </div>

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
              data-testid="register-email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              data-testid="register-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="register-submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled
              data-testid="register-google"
              className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              title="Coming soon"
            >
              Google
            </button>
            <button
              type="button"
              disabled
              data-testid="register-github"
              className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
              title="Coming soon"
            >
              GitHub
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">OAuth coming soon</p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-500"
            data-testid="register-login-link"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
