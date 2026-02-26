import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVersionStore } from "../stores/versionStore";
import {
  formatRelativeTime,
  formatFullDate,
} from "../components/versions/VersionItem";

// Mock the API module
vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    getAll: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../services/api";

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("versionStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = useVersionStore.getState();
    store.close();
  });

  describe("initial state", () => {
    it("should start closed with empty data", () => {
      const state = useVersionStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.versions).toEqual([]);
      expect(state.groupedVersions).toEqual([]);
      expect(state.selectedVersionId).toBeNull();
      expect(state.previewVersion).toBeNull();
      expect(state.diffs).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.useGrouped).toBe(true);
    });
  });

  describe("open/close", () => {
    it("should open and trigger fetch (S13-002)", () => {
      mockApi.get.mockResolvedValue([]);
      useVersionStore.getState().open("spreadsheet-1");

      const state = useVersionStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.selectedVersionId).toBeNull();
      expect(state.previewVersion).toBeNull();
    });

    it("should close and reset state (S13-013)", () => {
      useVersionStore.setState({
        isOpen: true,
        selectedVersionId: "v1",
        diffs: [{ sheetId: "s1", sheetName: "Sheet1", changes: [] }],
        error: "some error",
      });

      useVersionStore.getState().close();

      const state = useVersionStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.selectedVersionId).toBeNull();
      expect(state.previewVersion).toBeNull();
      expect(state.diffs).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe("fetchVersions (S13-015)", () => {
    it("should fetch paginated versions", async () => {
      const mockVersions = [
        {
          id: "v1",
          name: null,
          createdAt: "2026-02-26T10:00:00Z",
          createdBy: { id: "u1", name: "Alice", avatarUrl: null },
          hasChangeset: true,
        },
      ];

      mockApi.getAll.mockResolvedValue({
        data: mockVersions,
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      useVersionStore.setState({ useGrouped: false });
      await useVersionStore.getState().fetchVersions("spreadsheet-1");

      const state = useVersionStore.getState();
      expect(state.versions).toHaveLength(1);
      expect(state.versions[0].id).toBe("v1");
      expect(state.total).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it("should set error on fetch failure", async () => {
      mockApi.getAll.mockRejectedValue(new Error("Network error"));

      await useVersionStore.getState().fetchVersions("spreadsheet-1");

      const state = useVersionStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("fetchGroupedVersions (S13-009)", () => {
    it("should fetch grouped versions", async () => {
      const mockGroups = [
        {
          period: "Today",
          versions: [
            {
              id: "v1",
              name: "Initial",
              createdAt: "2026-02-26T10:00:00Z",
              createdBy: { id: "u1", name: "Alice", avatarUrl: null },
              hasChangeset: false,
            },
          ],
        },
      ];

      mockApi.get.mockResolvedValue(mockGroups);

      await useVersionStore.getState().fetchGroupedVersions("spreadsheet-1");

      const state = useVersionStore.getState();
      expect(state.groupedVersions).toHaveLength(1);
      expect(state.groupedVersions[0].period).toBe("Today");
      expect(state.groupedVersions[0].versions).toHaveLength(1);
    });
  });

  describe("selectVersion (S13-005)", () => {
    it("should select version and fetch preview + diff", async () => {
      const mockVersion = {
        id: "v1",
        name: null,
        snapshot: { title: "Test", sheets: [] },
        changeset: null,
        createdAt: "2026-02-26T10:00:00Z",
        createdBy: { id: "u1", name: "Alice", avatarUrl: null },
      };

      const mockDiffs = [
        {
          sheetId: "s1",
          sheetName: "Sheet1",
          changes: [{ cellKey: "A1", oldValue: "1", newValue: "2" }],
        },
      ];

      mockApi.get
        .mockResolvedValueOnce(mockVersion)
        .mockResolvedValueOnce(mockDiffs);

      await useVersionStore.getState().selectVersion("spreadsheet-1", "v1");

      const state = useVersionStore.getState();
      expect(state.selectedVersionId).toBe("v1");
      expect(state.previewVersion).toBeDefined();
      expect(state.previewVersion?.id).toBe("v1");
      expect(state.diffs).toHaveLength(1);
      expect(state.isPreviewLoading).toBe(false);
    });
  });

  describe("restoreVersion (S13-006)", () => {
    it("should call restore API and reset preview", async () => {
      mockApi.post.mockResolvedValue({ message: "Version restored" });

      useVersionStore.setState({
        selectedVersionId: "v1",
        previewVersion: {
          id: "v1",
          name: null,
          snapshot: { title: "Test", sheets: [] },
          changeset: null,
          createdAt: "2026-02-26T10:00:00Z",
          createdBy: { id: "u1", name: "Alice", avatarUrl: null },
        },
      });

      await useVersionStore.getState().restoreVersion("spreadsheet-1", "v1");

      expect(mockApi.post).toHaveBeenCalledWith(
        "/spreadsheets/spreadsheet-1/versions/v1/restore",
      );

      const state = useVersionStore.getState();
      expect(state.selectedVersionId).toBeNull();
      expect(state.previewVersion).toBeNull();
      expect(state.isRestoring).toBe(false);
    });
  });

  describe("nameVersion (S13-007)", () => {
    it("should update version name in all collections", async () => {
      const updated = {
        id: "v1",
        name: "Q4 Release",
        createdAt: "2026-02-26T10:00:00Z",
        createdBy: { id: "u1", name: "Alice", avatarUrl: null },
        hasChangeset: true,
      };

      mockApi.put.mockResolvedValue(updated);

      useVersionStore.setState({
        versions: [
          {
            id: "v1",
            name: null,
            createdAt: "2026-02-26T10:00:00Z",
            createdBy: { id: "u1", name: "Alice", avatarUrl: null },
            hasChangeset: true,
          },
        ],
        groupedVersions: [
          {
            period: "Today",
            versions: [
              {
                id: "v1",
                name: null,
                createdAt: "2026-02-26T10:00:00Z",
                createdBy: { id: "u1", name: "Alice", avatarUrl: null },
                hasChangeset: true,
              },
            ],
          },
        ],
      });

      await useVersionStore
        .getState()
        .nameVersion("spreadsheet-1", "v1", "Q4 Release");

      expect(mockApi.put).toHaveBeenCalledWith(
        "/spreadsheets/spreadsheet-1/versions/v1/name",
        { name: "Q4 Release" },
      );

      const state = useVersionStore.getState();
      expect(state.versions[0].name).toBe("Q4 Release");
      expect(state.groupedVersions[0].versions[0].name).toBe("Q4 Release");
    });
  });

  describe("copyAsSpreadsheet (S13-011)", () => {
    it("should call copy API and return new spreadsheet", async () => {
      mockApi.post.mockResolvedValue({
        id: "new-spreadsheet-1",
        title: "Test (Version: v1)",
      });

      const result = await useVersionStore
        .getState()
        .copyAsSpreadsheet("spreadsheet-1", "v1");

      expect(mockApi.post).toHaveBeenCalledWith(
        "/spreadsheets/spreadsheet-1/versions/v1/copy",
      );
      expect(result.id).toBe("new-spreadsheet-1");
    });
  });

  describe("clearPreview (S13-013)", () => {
    it("should reset preview state", () => {
      useVersionStore.setState({
        selectedVersionId: "v1",
        previewVersion: {
          id: "v1",
          name: null,
          snapshot: { title: "Test", sheets: [] },
          changeset: null,
          createdAt: "2026-02-26T10:00:00Z",
          createdBy: { id: "u1", name: "Alice", avatarUrl: null },
        },
        diffs: [{ sheetId: "s1", sheetName: "Sheet1", changes: [] }],
      });

      useVersionStore.getState().clearPreview();

      const state = useVersionStore.getState();
      expect(state.selectedVersionId).toBeNull();
      expect(state.previewVersion).toBeNull();
      expect(state.diffs).toEqual([]);
    });
  });
});

describe("formatRelativeTime", () => {
  it("should return 'Just now' for very recent times", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("should return minutes for recent times", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("should return hours for same-day times", () => {
    const twoHrAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(formatRelativeTime(twoHrAgo)).toBe("2h ago");
  });

  it("should return days for recent dates", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });
});

describe("formatFullDate", () => {
  it("should return a formatted date string", () => {
    const result = formatFullDate("2026-02-26T14:30:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
