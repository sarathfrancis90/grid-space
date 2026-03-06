import React, { useEffect, useState, useCallback } from "react";
import {
  useExtensionStore,
  type ExtensionSummary,
  type ExtensionInstallInfo,
} from "../../stores/extensionStore";

type Tab = "marketplace" | "installed" | "develop";

interface ExtensionManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERMISSION_LABELS: Record<string, string> = {
  "read:cells": "Read cell data",
  "write:cells": "Write cell data",
  "read:sheets": "Read sheet structure",
  "write:sheets": "Modify sheets",
  "read:metadata": "Read spreadsheet metadata",
  "write:metadata": "Write spreadsheet metadata",
  "ui:sidebar": "Show sidebar panel",
  "ui:dialog": "Show dialogs",
  "network:fetch": "Make network requests",
};

function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span
      className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
      data-testid={`permission-badge-${permission}`}
    >
      {PERMISSION_LABELS[permission] ?? permission}
    </span>
  );
}

const PermissionBadgeMemo = React.memo(PermissionBadge);

function ExtensionCard({
  extension,
  installedSlugs,
  onInstall,
  onUninstall,
}: {
  extension: ExtensionSummary;
  installedSlugs: Set<string>;
  onInstall: (slug: string) => void;
  onUninstall: (slug: string) => void;
}) {
  const isInstalled = installedSlugs.has(extension.slug);

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-gray-200 p-4"
      data-testid={`extension-card-${extension.slug}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
        {extension.iconUrl ? (
          <img
            src={extension.iconUrl}
            alt={extension.name}
            className="h-10 w-10 rounded-lg"
          />
        ) : (
          extension.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-gray-900">
            {extension.name}
          </h3>
          <span className="text-xs text-gray-500">v{extension.version}</span>
          {extension.isVerified && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
              Verified
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">{extension.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {extension.permissions.map((p) => (
            <PermissionBadgeMemo key={p} permission={p} />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span>By {extension.author.name ?? "Unknown"}</span>
          <span>{extension.installCount} installs</span>
        </div>
      </div>
      <div className="shrink-0">
        {isInstalled ? (
          <button
            onClick={() => onUninstall(extension.slug)}
            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            data-testid={`uninstall-${extension.slug}`}
          >
            Uninstall
          </button>
        ) : (
          <button
            onClick={() => onInstall(extension.slug)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            data-testid={`install-${extension.slug}`}
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}

const ExtensionCardMemo = React.memo(ExtensionCard);

function InstalledExtensionRow({
  install,
  onToggle,
  onUninstall,
}: {
  install: ExtensionInstallInfo;
  onToggle: (slug: string, enabled: boolean) => void;
  onUninstall: (slug: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-gray-200 p-4"
      data-testid={`installed-${install.extension.slug}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
        {install.extension.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-gray-900">
          {install.extension.name}
        </h3>
        <p className="text-sm text-gray-500">v{install.extension.version}</p>
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={install.isEnabled}
          onChange={(e) => onToggle(install.extension.slug, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
          data-testid={`toggle-${install.extension.slug}`}
        />
        <span className="text-sm text-gray-600">
          {install.isEnabled ? "Enabled" : "Disabled"}
        </span>
      </label>
      <button
        onClick={() => onUninstall(install.extension.slug)}
        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        data-testid={`uninstall-installed-${install.extension.slug}`}
      >
        Uninstall
      </button>
    </div>
  );
}

const InstalledExtensionRowMemo = React.memo(InstalledExtensionRow);

function CreateExtensionForm({ onCreated }: { onCreated: () => void }) {
  const createExtension = useExtensionStore((s) => s.createExtension);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createExtension({
        name: name.trim(),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      onCreated();
    } finally {
      setCreating(false);
    }
  }, [name, description, createExtension, onCreated]);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 font-medium text-gray-900">Create New Extension</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Extension name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          data-testid="ext-name-input"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          rows={3}
          data-testid="ext-description-input"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          data-testid="create-extension-btn"
        >
          {creating ? "Creating..." : "Create Extension"}
        </button>
      </div>
    </div>
  );
}

export function ExtensionManagerDialog({
  isOpen,
  onClose,
}: ExtensionManagerDialogProps) {
  const [tab, setTab] = useState<Tab>("marketplace");
  const {
    marketplace,
    installed,
    myExtensions,
    isLoading,
    error,
    fetchMarketplace,
    fetchInstalled,
    fetchMyExtensions,
    installExtension,
    uninstallExtension,
    toggleExtension,
    clearError,
  } = useExtensionStore();

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "marketplace") fetchMarketplace();
    else if (tab === "installed") fetchInstalled();
    else if (tab === "develop") fetchMyExtensions();
  }, [isOpen, tab, fetchMarketplace, fetchInstalled, fetchMyExtensions]);

  const installedSlugs = new Set(installed.map((i) => i.extension.slug));

  const handleInstall = useCallback(
    (slug: string) => installExtension(slug),
    [installExtension],
  );

  const handleUninstall = useCallback(
    (slug: string) => uninstallExtension(slug),
    [uninstallExtension],
  );

  const handleToggle = useCallback(
    (slug: string, enabled: boolean) => toggleExtension(slug, enabled),
    [toggleExtension],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="extension-manager-dialog"
    >
      <div className="flex h-[600px] w-[800px] flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Extensions & Add-ons
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="close-extension-dialog"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {(
            [
              ["marketplace", "Marketplace"],
              ["installed", "Installed"],
              ["develop", "Develop"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              data-testid={`tab-${key}`}
            >
              {label}
              {key === "installed" && installed.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                  {installed.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded bg-red-50 px-4 py-2 text-sm text-red-700">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Loading...
            </div>
          ) : tab === "marketplace" ? (
            <div className="space-y-3">
              {marketplace.length === 0 ? (
                <p className="text-center text-gray-500">
                  No extensions available yet. Be the first to publish one!
                </p>
              ) : (
                marketplace.map((ext) => (
                  <ExtensionCardMemo
                    key={ext.id}
                    extension={ext}
                    installedSlugs={installedSlugs}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                  />
                ))
              )}
            </div>
          ) : tab === "installed" ? (
            <div className="space-y-3">
              {installed.length === 0 ? (
                <p className="text-center text-gray-500">
                  No extensions installed. Browse the marketplace to find
                  extensions.
                </p>
              ) : (
                installed.map((inst) => (
                  <InstalledExtensionRowMemo
                    key={inst.id}
                    install={inst}
                    onToggle={handleToggle}
                    onUninstall={handleUninstall}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <CreateExtensionForm onCreated={fetchMyExtensions} />
              {myExtensions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">My Extensions</h3>
                  {myExtensions.map((ext) => (
                    <div
                      key={ext.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                      data-testid={`my-ext-${ext.slug}`}
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {ext.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          v{ext.version} &middot;{" "}
                          {ext.isPublished ? "Published" : "Draft"}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          ext.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ext.isPublished ? "Live" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtensionManagerDialog;
