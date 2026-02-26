import { useState } from "react";
import type { FormEvent } from "react";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../services/api";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1
          className="mb-8 text-2xl font-bold text-gray-900"
          data-testid="profile-title"
        >
          Profile Settings
        </h1>

        {/* Profile Info */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Profile Information
          </h2>

          {message && (
            <div
              className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
              data-testid="profile-message"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p
                className="mt-1 text-sm text-gray-500"
                data-testid="profile-email"
              >
                {user.email}
              </p>
            </div>

            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="profile-name-input"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              data-testid="profile-save"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Change Password
          </h2>

          {passwordMessage && (
            <div
              className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
              data-testid="password-message"
            >
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              data-testid="profile-change-password"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {isChangingPassword ? "Changing..." : "Change password"}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-red-600">
            Danger Zone
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Permanently delete your account and all your data.
          </p>
          <button
            onClick={() => logout()}
            data-testid="profile-logout"
            className="mr-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
          <button
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure? This will permanently delete your account.",
                )
              ) {
                await api.delete("/users/me");
                await logout();
              }
            }}
            data-testid="profile-delete"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
