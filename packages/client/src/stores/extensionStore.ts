/**
 * Extension store — manages installed extensions, their lifecycle,
 * permissions, and local storage. Uses Zustand + Immer.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  InstalledExtension,
  ExtensionManifest,
  ExtensionPermission,
  ExtensionStatus,
} from "../types/extension";

interface ExtensionState {
  /** All installed extensions */
  extensions: InstalledExtension[];
  /** Whether the extension manager panel is open */
  isPanelOpen: boolean;
  /** Currently selected extension for detail view */
  selectedExtensionId: string | null;
  /** Loading state */
  isLoading: boolean;

  /** Open/close the extension manager panel */
  setPanelOpen: (open: boolean) => void;
  /** Select an extension for detail view */
  selectExtension: (id: string | null) => void;
  /** Install a new extension */
  installExtension: (
    manifest: ExtensionManifest,
    grantedPermissions: ExtensionPermission[],
  ) => string;
  /** Uninstall an extension */
  uninstallExtension: (id: string) => void;
  /** Update extension status */
  setExtensionStatus: (
    id: string,
    status: ExtensionStatus,
    errorMessage?: string,
  ) => void;
  /** Update granted permissions */
  setGrantedPermissions: (
    id: string,
    permissions: ExtensionPermission[],
  ) => void;
  /** Set a value in extension-local storage */
  setExtensionStorage: (id: string, key: string, value: string | null) => void;
  /** Get a value from extension-local storage */
  getExtensionStorage: (id: string, key: string) => string | null;
  /** Get an extension by ID */
  getExtension: (id: string) => InstalledExtension | undefined;
  /** Get extensions by status */
  getExtensionsByStatus: (status: ExtensionStatus) => InstalledExtension[];
  /** Check if an extension has a specific permission */
  hasPermission: (id: string, permission: ExtensionPermission) => boolean;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Load extensions from server response */
  loadExtensions: (extensions: InstalledExtension[]) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useExtensionStore = create<ExtensionState>()(
  immer((set, get) => ({
    extensions: [],
    isPanelOpen: false,
    selectedExtensionId: null,
    isLoading: false,

    setPanelOpen: (open: boolean) => {
      set((state) => {
        state.isPanelOpen = open;
      });
    },

    selectExtension: (id: string | null) => {
      set((state) => {
        state.selectedExtensionId = id;
      });
    },

    installExtension: (
      manifest: ExtensionManifest,
      grantedPermissions: ExtensionPermission[],
    ): string => {
      const id = generateId();
      const now = new Date().toISOString();

      set((state) => {
        // Prevent duplicate installs
        const existing = state.extensions.find(
          (e) => e.extensionId === manifest.id,
        );
        if (existing) return;

        state.extensions.push({
          id,
          extensionId: manifest.id,
          manifest,
          status: "installed",
          grantedPermissions,
          installedAt: now,
          updatedAt: now,
          localStorage: {},
        });
      });

      return id;
    },

    uninstallExtension: (id: string) => {
      set((state) => {
        state.extensions = state.extensions.filter((e) => e.id !== id);
        if (state.selectedExtensionId === id) {
          state.selectedExtensionId = null;
        }
      });
    },

    setExtensionStatus: (
      id: string,
      status: ExtensionStatus,
      errorMessage?: string,
    ) => {
      set((state) => {
        const ext = state.extensions.find((e) => e.id === id);
        if (ext) {
          ext.status = status;
          ext.errorMessage = status === "error" ? errorMessage : undefined;
          ext.updatedAt = new Date().toISOString();
        }
      });
    },

    setGrantedPermissions: (id: string, permissions: ExtensionPermission[]) => {
      set((state) => {
        const ext = state.extensions.find((e) => e.id === id);
        if (ext) {
          ext.grantedPermissions = permissions;
          ext.updatedAt = new Date().toISOString();
        }
      });
    },

    setExtensionStorage: (id: string, key: string, value: string | null) => {
      set((state) => {
        const ext = state.extensions.find((e) => e.id === id);
        if (ext) {
          if (value === null) {
            delete ext.localStorage[key];
          } else {
            ext.localStorage[key] = value;
          }
        }
      });
    },

    getExtensionStorage: (id: string, key: string): string | null => {
      const ext = get().extensions.find((e) => e.id === id);
      if (!ext) return null;
      return ext.localStorage[key] ?? null;
    },

    getExtension: (id: string) => {
      return get().extensions.find((e) => e.id === id);
    },

    getExtensionsByStatus: (status: ExtensionStatus) => {
      return get().extensions.filter((e) => e.status === status);
    },

    hasPermission: (id: string, permission: ExtensionPermission): boolean => {
      const ext = get().extensions.find((e) => e.id === id);
      if (!ext) return false;
      return ext.grantedPermissions.includes(permission);
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    loadExtensions: (extensions: InstalledExtension[]) => {
      set((state) => {
        state.extensions = extensions;
      });
    },
  })),
);
