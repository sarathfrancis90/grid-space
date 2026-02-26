import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

interface Collaborator {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface ShareLinkInfo {
  shareLink: string | null;
  shareLinkRole: string | null;
}

interface SharingState {
  collaborators: Collaborator[];
  shareLink: ShareLinkInfo;
  isLoading: boolean;
  isDialogOpen: boolean;
  error: string | null;
}

interface SharingActions {
  openDialog: (spreadsheetId: string) => void;
  closeDialog: () => void;
  fetchCollaborators: (spreadsheetId: string) => Promise<void>;
  addCollaborator: (
    spreadsheetId: string,
    email: string,
    role: "viewer" | "commenter" | "editor",
  ) => Promise<void>;
  changeRole: (
    spreadsheetId: string,
    userId: string,
    role: "viewer" | "commenter" | "editor",
  ) => Promise<void>;
  removeCollaborator: (spreadsheetId: string, userId: string) => Promise<void>;
  fetchShareLink: (spreadsheetId: string) => Promise<void>;
  createShareLink: (
    spreadsheetId: string,
    role?: "viewer" | "commenter" | "editor",
  ) => Promise<void>;
  disableShareLink: (spreadsheetId: string) => Promise<void>;
  transferOwnership: (spreadsheetId: string, email: string) => Promise<void>;
  publishToWeb: (spreadsheetId: string) => Promise<string>;
  unpublishFromWeb: (spreadsheetId: string) => Promise<void>;
  clearError: () => void;
}

type SharingStore = SharingState & SharingActions;

// Track which spreadsheet is currently being shared; set in openDialog, read by async actions
export let currentSpreadsheetId = "";

export const useSharingStore = create<SharingStore>()(
  immer((set) => ({
    collaborators: [],
    shareLink: { shareLink: null, shareLinkRole: null },
    isLoading: false,
    isDialogOpen: false,
    error: null,

    openDialog: (spreadsheetId: string) => {
      currentSpreadsheetId = spreadsheetId;
      set((state) => {
        state.isDialogOpen = true;
        state.error = null;
      });
    },

    closeDialog: () => {
      set((state) => {
        state.isDialogOpen = false;
      });
    },

    fetchCollaborators: async (spreadsheetId: string) => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        const data = await api.get<Collaborator[]>(
          `/spreadsheets/${spreadsheetId}/access`,
        );
        set((state) => {
          state.collaborators = data;
          state.isLoading = false;
        });
      } catch (err) {
        set((state) => {
          state.isLoading = false;
          state.error =
            err instanceof Error ? err.message : "Failed to load collaborators";
        });
      }
    },

    addCollaborator: async (
      spreadsheetId: string,
      email: string,
      role: "viewer" | "commenter" | "editor",
    ) => {
      try {
        const collaborator = await api.post<Collaborator>(
          `/spreadsheets/${spreadsheetId}/access`,
          { email, role },
        );
        set((state) => {
          state.collaborators.push(collaborator);
          state.error = null;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add collaborator";
        set((state) => {
          state.error = message;
        });
        throw err;
      }
    },

    changeRole: async (
      spreadsheetId: string,
      userId: string,
      role: "viewer" | "commenter" | "editor",
    ) => {
      try {
        await api.put(`/spreadsheets/${spreadsheetId}/access/${userId}`, {
          role,
        });
        set((state) => {
          const idx = state.collaborators.findIndex((c) => c.userId === userId);
          if (idx !== -1) {
            state.collaborators[idx].role = role;
          }
        });
      } catch (err) {
        set((state) => {
          state.error =
            err instanceof Error ? err.message : "Failed to change role";
        });
      }
    },

    removeCollaborator: async (spreadsheetId: string, userId: string) => {
      try {
        await api.delete(`/spreadsheets/${spreadsheetId}/access/${userId}`);
        set((state) => {
          state.collaborators = state.collaborators.filter(
            (c) => c.userId !== userId,
          );
        });
      } catch (err) {
        set((state) => {
          state.error =
            err instanceof Error ? err.message : "Failed to remove user";
        });
      }
    },

    fetchShareLink: async (spreadsheetId: string) => {
      try {
        const data = await api.get<ShareLinkInfo>(
          `/spreadsheets/${spreadsheetId}/share-link`,
        );
        set((state) => {
          state.shareLink = data;
        });
      } catch {
        // Ignore errors for share link fetch
      }
    },

    createShareLink: async (
      spreadsheetId: string,
      role: "viewer" | "commenter" | "editor" = "viewer",
    ) => {
      try {
        const data = await api.post<ShareLinkInfo>(
          `/spreadsheets/${spreadsheetId}/share-link`,
          { role },
        );
        set((state) => {
          state.shareLink = data;
        });
      } catch (err) {
        set((state) => {
          state.error =
            err instanceof Error ? err.message : "Failed to create share link";
        });
      }
    },

    disableShareLink: async (spreadsheetId: string) => {
      try {
        await api.delete(`/spreadsheets/${spreadsheetId}/share-link`);
        set((state) => {
          state.shareLink = { shareLink: null, shareLinkRole: null };
        });
      } catch (err) {
        set((state) => {
          state.error =
            err instanceof Error ? err.message : "Failed to disable link";
        });
      }
    },

    transferOwnership: async (spreadsheetId: string, email: string) => {
      await api.post(`/spreadsheets/${spreadsheetId}/transfer-ownership`, {
        email,
      });
    },

    publishToWeb: async (spreadsheetId: string) => {
      const data = await api.post<{ publishedUrl: string }>(
        `/spreadsheets/${spreadsheetId}/publish`,
      );
      return data.publishedUrl;
    },

    unpublishFromWeb: async (spreadsheetId: string) => {
      await api.delete(`/spreadsheets/${spreadsheetId}/publish`);
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  })),
);
