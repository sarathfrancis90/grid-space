import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTemplateStore } from "../stores/templateStore";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("templateStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTemplateStore.setState({
      templates: [],
      isLoading: false,
      error: null,
    });
  });

  // S15-015: Template gallery
  it("has correct initial state", () => {
    const state = useTemplateStore.getState();
    expect(state.templates).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("fetchTemplates sets loading state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    const promise = useTemplateStore.getState().fetchTemplates();
    expect(useTemplateStore.getState().isLoading).toBe(true);
    await promise;
    expect(useTemplateStore.getState().isLoading).toBe(false);
  });

  // S15-017: Built-in templates
  it("fetchTemplates populates templates list", async () => {
    const templates = [
      {
        id: "builtin-budget",
        title: "Monthly Budget",
        templateName: "Budget",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        owner: { id: "system", name: "GridSpace", avatarUrl: null },
      },
      {
        id: "builtin-invoice",
        title: "Invoice Template",
        templateName: "Invoice",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        owner: { id: "system", name: "GridSpace", avatarUrl: null },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: templates }),
    });

    await useTemplateStore.getState().fetchTemplates();

    const state = useTemplateStore.getState();
    expect(state.templates).toHaveLength(2);
    expect(state.templates[0].templateName).toBe("Budget");
  });

  it("fetchTemplates sets error on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 500, message: "Server error" },
      }),
    });

    await useTemplateStore.getState().fetchTemplates();

    const state = useTemplateStore.getState();
    expect(state.error).toBe("Server error");
    expect(state.isLoading).toBe(false);
  });

  // S15-016: Create spreadsheet from template
  it("createFromTemplate returns a new spreadsheet", async () => {
    const newSpreadsheet = {
      id: "ss-new",
      title: "Monthly Budget",
      isStarred: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      owner: { id: "u-1", name: "Test", email: "t@t.com", avatarUrl: null },
      sheets: [
        {
          id: "sh-1",
          name: "Budget",
          index: 0,
          cellData: {},
          columnMeta: {},
          rowMeta: {},
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: newSpreadsheet }),
    });

    const result = await useTemplateStore
      .getState()
      .createFromTemplate("builtin-budget");
    expect(result.id).toBe("ss-new");
    expect(result.title).toBe("Monthly Budget");
  });

  // S15-018: Save spreadsheet as template
  it("saveAsTemplate calls API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: "ss-1", isTemplate: true, templateName: "My Template" },
      }),
    });

    await useTemplateStore.getState().saveAsTemplate("ss-1", "My Template");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("clearError resets error", () => {
    useTemplateStore.setState({ error: "Some error" });
    useTemplateStore.getState().clearError();
    expect(useTemplateStore.getState().error).toBeNull();
  });
});
