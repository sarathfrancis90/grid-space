import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../services/api";
import { GridSpaceLogo } from "../ui/GridSpaceLogo";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await api.put<UserProfile>("/users/me", { name });
      setUser(updated);
      setMessage("Profile updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      await api.put("/users/me/password", {
        currentPassword,
        newPassword,
      });
      setPasswordMessage("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordMessage(
        err instanceof Error ? err.message : "Password change failed",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (!user) return null;

  const initials = (user.name || user.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}
    >
      {/* Header */}
      <div
        className="border-b border-gray-200 bg-white shadow-sm"
        style={{
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4"
          style={{
            maxWidth: "672px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 24px",
          }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "8px",
              padding: "4px",
              color: "#6b7280",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <GridSpaceLogo size={28} />
          <span
            className="text-lg font-semibold text-gray-900"
            style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}
          >
            GridSpace
          </span>
        </div>
      </div>

      {/* Page Content */}
      <div
        className="mx-auto max-w-2xl px-6 py-8"
        style={{
          maxWidth: "672px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <h1
          className="mb-8 text-2xl font-bold text-gray-900"
          style={{
            marginBottom: "32px",
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
          }}
          data-testid="profile-title"
        >
          Profile Settings
        </h1>

        {/* Avatar & Account Overview */}
        <div
          className="mb-6 rounded-xl bg-white p-6 shadow-sm"
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            backgroundColor: "#fff",
            padding: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="flex items-center gap-4"
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a73e8] text-xl font-bold text-white"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#1a73e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <p
                className="text-lg font-semibold text-gray-900"
                style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}
              >
                {user.name || "No name set"}
              </p>
              <p
                className="text-sm text-gray-500"
                style={{ fontSize: "14px", color: "#6b7280" }}
              >
                {user.email}
              </p>
              <p
                className="mt-1 text-xs text-gray-400"
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div
          className="mb-6 rounded-xl bg-white p-6 shadow-sm"
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            backgroundColor: "#fff",
            padding: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            className="mb-4 text-lg font-semibold text-gray-900"
            style={{
              marginBottom: "16px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Profile Information
          </h2>

          {message && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                message === "Profile updated"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
              style={{
                marginBottom: "16px",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
                backgroundColor:
                  message === "Profile updated" ? "#f0fdf4" : "#fef2f2",
                color: message === "Profile updated" ? "#15803d" : "#b91c1c",
              }}
              data-testid="profile-message"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div
              className="space-y-4"
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  Email
                </label>
                <p
                  className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  style={{
                    marginTop: "4px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    padding: "8px 12px",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                  data-testid="profile-email"
                >
                  {user.email}
                </p>
              </div>

              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="profile-name-input"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                  style={{
                    marginTop: "4px",
                    display: "block",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px" }} className="mt-5">
              <button
                type="submit"
                disabled={isSaving}
                data-testid="profile-save"
                className="rounded-lg bg-[#1a73e8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1765cc] disabled:opacity-50"
                style={{
                  borderRadius: "8px",
                  backgroundColor: "#1a73e8",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#fff",
                  border: "none",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div
          className="mb-6 rounded-xl bg-white p-6 shadow-sm"
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            backgroundColor: "#fff",
            padding: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            className="mb-4 text-lg font-semibold text-gray-900"
            style={{
              marginBottom: "16px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Change Password
          </h2>

          {passwordMessage && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                passwordMessage === "Password changed"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
              style={{
                marginBottom: "16px",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
                backgroundColor:
                  passwordMessage === "Password changed"
                    ? "#f0fdf4"
                    : "#fef2f2",
                color:
                  passwordMessage === "Password changed"
                    ? "#15803d"
                    : "#b91c1c",
              }}
              data-testid="password-message"
            >
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div
              className="space-y-4"
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  htmlFor="current-password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  data-testid="profile-current-password"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                  style={{
                    marginTop: "4px",
                    display: "block",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  data-testid="profile-new-password"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                  style={{
                    marginTop: "4px",
                    display: "block",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    padding: "8px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px" }} className="mt-5">
              <button
                type="submit"
                disabled={isChangingPassword}
                data-testid="profile-change-password"
                className="rounded-lg bg-[#1a73e8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1765cc] disabled:opacity-50"
                style={{
                  borderRadius: "8px",
                  backgroundColor: "#1a73e8",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#fff",
                  border: "none",
                  cursor: isChangingPassword ? "not-allowed" : "pointer",
                  opacity: isChangingPassword ? 0.5 : 1,
                }}
              >
                {isChangingPassword ? "Changing..." : "Change password"}
              </button>
            </div>
          </form>
        </div>

        {/* Account Card — Sign Out */}
        <div
          className="mb-6 rounded-xl bg-white p-6 shadow-sm"
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            backgroundColor: "#fff",
            padding: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            className="mb-2 text-lg font-semibold text-gray-900"
            style={{
              marginBottom: "8px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Account
          </h2>
          <p
            className="mb-4 text-sm text-gray-500"
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Sign out of your GridSpace account on this device.
          </p>
          <button
            onClick={() => logout()}
            data-testid="profile-logout"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            style={{
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>

        {/* Danger Zone Card */}
        <div
          className="rounded-xl border-2 border-red-200 bg-white p-6 shadow-sm"
          style={{
            borderRadius: "12px",
            border: "2px solid #fecaca",
            backgroundColor: "#fff",
            padding: "24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            className="mb-2 text-lg font-semibold text-red-600"
            style={{
              marginBottom: "8px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#dc2626",
            }}
          >
            Danger Zone
          </h2>
          <p
            className="mb-4 text-sm text-gray-500"
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Permanently delete your account and all associated spreadsheets.
            This action cannot be undone.
          </p>
          <button
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure? This will permanently delete your account and all your data.",
                )
              ) {
                await api.delete("/users/me");
                await logout();
              }
            }}
            data-testid="profile-delete"
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            style={{
              borderRadius: "8px",
              backgroundColor: "#dc2626",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
