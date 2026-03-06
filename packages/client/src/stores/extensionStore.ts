import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

// ─── Types ──────────────────────────────────────────────

export type ExtensionPermission =
  | "read:cells"
  | "write:cells"
  | "read:sheets"
  | "write:sheets"
  | "read:metadata"
  | "write:metadata"
  | "ui:sidebar"
  | "ui:dialog"
  | "network:fetch";

export interface ExtensionSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  iconUrl: string | null;
  permissions: string[];
  isPublished: boolean;
  isVerified: boolean;
  installCount: number;
  author: { id: string; name: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionDetail extends ExtensionSummary {
  entryPoint: string;
  sourceCode: string;
  config: Record<string, unknown>;
}

export interface ExtensionInstallInfo {
  id: string;
  extensionId: string;
  userId: string;
  isEnabled: boolean;
  settings: Record<string, unknown>;
  extension: ExtensionSummary;
  createdAt: string;
}

interface ExtensionState {
  marketplace: ExtensionSummary[];
  installed: ExtensionInstallInfo[];
  myExtensions: ExtensionSummary[];
  selectedExtension: ExtensionDetail | null;
  isLoading: boolean;
  error: string | null;

  fetchMarketplace: () => Promise<void>;
  fetchInstalled: () => Promise<void>;
  fetchMyExtensions: () => Promise<void>;
  getExtensionDetail: (slug: string) => Promise<void>;
  installExtension: (slug: string) => Promise<void>;
  uninstallExtension: (slug: string) => Promise<void>;
  toggleExtension: (slug: string, isEnabled: boolean) => Promise<void>;
  createExtension: (data: {
    name: string;
    description?: string;
    version?: string;
    permissions?: string[];
    entryPoint?: string;
    sourceCode?: string;
  }) => Promise<ExtensionDetail>;
  updateExtension: (
    slug: string,
    data: {
      name?: string;
      description?: string;
      version?: string;
      permissions?: string[];
      entryPoint?: string;
      sourceCode?: string;
      isPublished?: boolean;
    },
  ) => Promise<void>;
  deleteExtension: (slug: string) => Promise<void>;
  clearError: () => void;
  clearSelected: () => void;
}

export const useExtensionStore = create<ExtensionState>()(
  immer((set) => ({
    marketplace: [],
    installed: [],
    myExtensions: [],
    selectedExtension: null,
    isLoading: false,
    error: null,

    fetchMarketplace: async () => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
      });
      try {
        const data = await api.get<ExtensionSummary[]>(
          "/extensions/marketplace",
        );
        set((s) => {
          s.marketplace = data;
          s.isLoading = false;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Failed to load";
          s.isLoading = false;
        });
      }
    },

    fetchInstalled: async () => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
      });
      try {
        const data = await api.get<ExtensionInstallInfo[]>(
          "/extensions/installed",
        );
        set((s) => {
          s.installed = data;
          s.isLoading = false;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Failed to load";
          s.isLoading = false;
        });
      }
    },

    fetchMyExtensions: async () => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
      });
      try {
        const data = await api.get<ExtensionSummary[]>("/extensions/my");
        set((s) => {
          s.myExtensions = data;
          s.isLoading = false;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Failed to load";
          s.isLoading = false;
        });
      }
    },

    getExtensionDetail: async (slug: string) => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
      });
      try {
        const data = await api.get<ExtensionDetail>(
          `/extensions/marketplace/${slug}`,
        );
        set((s) => {
          s.selectedExtension = data;
          s.isLoading = false;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Failed to load";
          s.isLoading = false;
        });
      }
    },

    installExtension: async (slug: string) => {
      try {
        const install = await api.post<ExtensionInstallInfo>(
          `/extensions/${slug}/install`,
        );
        set((s) => {
          s.installed.push(install);
          const ext = s.marketplace.find((e) => e.slug === slug);
          if (ext) ext.installCount += 1;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Install failed";
        });
      }
    },

    uninstallExtension: async (slug: string) => {
      try {
        await api.delete(`/extensions/${slug}/uninstall`);
        set((s) => {
          s.installed = s.installed.filter((i) => i.extension.slug !== slug);
          const ext = s.marketplace.find((e) => e.slug === slug);
          if (ext && ext.installCount > 0) ext.installCount -= 1;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Uninstall failed";
        });
      }
    },

    toggleExtension: async (slug: string, isEnabled: boolean) => {
      try {
        await api.put(`/extensions/${slug}/toggle`, { isEnabled });
        set((s) => {
          const install = s.installed.find((i) => i.extension.slug === slug);
          if (install) install.isEnabled = isEnabled;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : "Toggle failed";
        });
      }
    },

    createExtension: async (data) => {
      const ext = await api.post<ExtensionDetail>("/extensions", data);
      set((s) => {
        s.myExtensions.unshift(ext);
      });
      return ext;
    },

    updateExtension: async (slug, data) => {
      const ext = await api.put<ExtensionDetail>(`/extensions/${slug}`, data);
      set((s) => {
        const idx = s.myExtensions.findIndex((e) => e.slug === slug);
        if (idx >= 0) s.myExtensions[idx] = ext;
        if (s.selectedExtension?.slug === slug) s.selectedExtension = ext;
      });
    },

    deleteExtension: async (slug) => {
      await api.delete(`/extensions/${slug}`);
      set((s) => {
        s.myExtensions = s.myExtensions.filter((e) => e.slug !== slug);
        if (s.selectedExtension?.slug === slug) s.selectedExtension = null;
      });
    },

    clearError: () => {
      set((s) => {
        s.error = null;
      });
    },

    clearSelected: () => {
      set((s) => {
        s.selectedExtension = null;
      });
    },
  })),
);
