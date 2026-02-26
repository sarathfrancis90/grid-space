/**
 * Template store — manages template gallery and creating spreadsheets from templates.
 * S15-015 to S15-018
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "../services/api";

export interface TemplateSummary {
  id: string;
  title: string;
  templateName: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; avatarUrl: string | null };
}

interface SpreadsheetDetail {
  id: string;
  title: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  sheets: Array<{
    id: string;
    name: string;
    index: number;
    cellData: Record<string, unknown>;
    columnMeta: Record<string, unknown>;
    rowMeta: Record<string, unknown>;
  }>;
}

interface TemplateState {
  templates: TemplateSummary[];
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  createFromTemplate: (templateId: string) => Promise<SpreadsheetDetail>;
  saveAsTemplate: (
    spreadsheetId: string,
    templateName: string,
  ) => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  immer((set) => ({
    templates: [],
    isLoading: false,
    error: null,

    fetchTemplates: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const templates = await api.get<TemplateSummary[]>("/templates");

        set((state) => {
          state.templates = templates;
          state.isLoading = false;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load templates";
        set((state) => {
          state.isLoading = false;
          state.error = message;
        });
      }
    },

    createFromTemplate: async (templateId: string) => {
      const spreadsheet = await api.post<SpreadsheetDetail>(
        `/templates/${templateId}/create`,
      );
      return spreadsheet;
    },

    saveAsTemplate: async (spreadsheetId: string, templateName: string) => {
      await api.post(`/spreadsheets/${spreadsheetId}/save-as-template`, {
        templateName,
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  })),
);
