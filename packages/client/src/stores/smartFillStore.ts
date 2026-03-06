/**
 * Smart Fill store — manages smart fill suggestions state.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { SmartFillSuggestion } from "../utils/smartFill";
import type { OrganizeSuggestion } from "../utils/sheetOrganizer";

interface SmartFillState {
  /** Current fill suggestion (null = none) */
  suggestion: SmartFillSuggestion | null;
  /** Whether the preview overlay is visible */
  isPreviewVisible: boolean;
  /** Organization suggestions for the sheet */
  organizeSuggestions: OrganizeSuggestion[];
  /** Whether the organize panel is visible */
  isOrganizePanelOpen: boolean;
  /** Set or clear the current suggestion */
  setSuggestion: (suggestion: SmartFillSuggestion | null) => void;
  /** Show/hide the preview overlay */
  setPreviewVisible: (visible: boolean) => void;
  /** Accept the current suggestion (caller handles applying to cells) */
  acceptSuggestion: () => void;
  /** Reject and dismiss the current suggestion */
  rejectSuggestion: () => void;
  /** Set organize suggestions */
  setOrganizeSuggestions: (suggestions: OrganizeSuggestion[]) => void;
  /** Toggle the organize panel */
  setOrganizePanelOpen: (open: boolean) => void;
  /** Dismiss a single organize suggestion by index */
  dismissOrganizeSuggestion: (index: number) => void;
}

export const useSmartFillStore = create<SmartFillState>()(
  immer((set) => ({
    suggestion: null,
    isPreviewVisible: false,
    organizeSuggestions: [],
    isOrganizePanelOpen: false,

    setSuggestion: (suggestion: SmartFillSuggestion | null) => {
      set((state) => {
        state.suggestion = suggestion;
        state.isPreviewVisible = suggestion !== null;
      });
    },

    setPreviewVisible: (visible: boolean) => {
      set((state) => {
        state.isPreviewVisible = visible;
      });
    },

    acceptSuggestion: () => {
      set((state) => {
        state.suggestion = null;
        state.isPreviewVisible = false;
      });
    },

    rejectSuggestion: () => {
      set((state) => {
        state.suggestion = null;
        state.isPreviewVisible = false;
      });
    },

    setOrganizeSuggestions: (suggestions: OrganizeSuggestion[]) => {
      set((state) => {
        state.organizeSuggestions = suggestions;
      });
    },

    setOrganizePanelOpen: (open: boolean) => {
      set((state) => {
        state.isOrganizePanelOpen = open;
      });
    },

    dismissOrganizeSuggestion: (index: number) => {
      set((state) => {
        if (index >= 0 && index < state.organizeSuggestions.length) {
          state.organizeSuggestions.splice(index, 1);
        }
      });
    },
  })),
);
