import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock matchMedia for useMediaQuery hook
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import SpreadsheetEditorPage from "../SpreadsheetEditorPage";
import { useUIStore } from "../../../stores/uiStore";
import { useAuthStore } from "../../../stores/authStore";
import { useCloudStore } from "../../../stores/cloudStore";
import { useCommentStore } from "../../../stores/commentStore";
import { useSpreadsheetStore } from "../../../stores/spreadsheetStore";
import type { CellComment } from "../../../types/grid";

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={["/spreadsheet/test-id"]}>
      <Routes>
        <Route path="/spreadsheet/:id" element={<SpreadsheetEditorPage />} />
        <Route path="/profile" element={<div data-testid="profile-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Title bar elements", () => {
  beforeEach(() => {
    useUIStore.setState({ isToolbarCollapsed: false });
    useAuthStore.setState({
      user: {
        id: "u1",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: null,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });
    useCloudStore.setState({
      currentSpreadsheet: {
        id: "test-id",
        title: "Test Sheet",
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: {
          id: "u1",
          name: "Test User",
          email: "test@example.com",
          avatarUrl: null,
        },
        sheets: [],
      },
      isLoading: false,
      error: null,
    });
    useSpreadsheetStore.setState({
      activeSheetId: "sheet-1",
    });
  });

  it("renders user avatar with initial when no avatar URL", () => {
    renderEditor();
    const avatar = screen.getByTestId("titlebar-user-avatar");
    expect(avatar).toBeTruthy();
    expect(avatar.textContent).toBe("T");
  });

  it("renders comment icon button", () => {
    renderEditor();
    expect(screen.getByTestId("titlebar-comment-button")).toBeTruthy();
  });

  it("shows comment count badge when there are comments", () => {
    const comment: CellComment = {
      id: "c1",
      cellKey: "0,0",
      sheetId: "sheet-1",
      text: "Hello",
      author: "Test User",
      authorId: "u1",
      createdAt: Date.now(),
      resolved: false,
      replies: [],
    };
    useCommentStore.setState({
      comments: new Map([["sheet-1", [comment]]]),
    });
    renderEditor();
    const badge = screen.getByTestId("comment-count-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("1");
  });

  it("does not show badge when no comments", () => {
    useCommentStore.setState({
      comments: new Map(),
    });
    renderEditor();
    expect(screen.queryByTestId("comment-count-badge")).toBeNull();
  });

  it("shows expand button when toolbar is collapsed", () => {
    useUIStore.setState({ isToolbarCollapsed: true });
    renderEditor();
    expect(screen.getByTestId("toolbar-expand-button")).toBeTruthy();
  });

  it("expands toolbar when expand button is clicked", () => {
    useUIStore.setState({ isToolbarCollapsed: true });
    renderEditor();
    fireEvent.click(screen.getByTestId("toolbar-expand-button"));
    expect(useUIStore.getState().isToolbarCollapsed).toBe(false);
  });
});
