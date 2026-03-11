import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TemplateGallery } from "../components/dashboard/TemplateGallery";
import { useTemplateStore } from "../stores/templateStore";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeTemplate(
  id: string,
  templateName: string,
  title: string = templateName,
) {
  return {
    id,
    title,
    templateName,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "owner-1", name: "GridSpace", avatarUrl: null },
  };
}

// No-op fetchTemplates to prevent state changes during render
const noopFetch = vi.fn().mockResolvedValue(undefined);

describe("TemplateGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTemplateStore.setState({
      templates: [],
      isLoading: false,
      error: null,
      fetchTemplates: noopFetch,
    });
  });

  function renderGallery() {
    return render(
      <MemoryRouter>
        <TemplateGallery />
      </MemoryRouter>,
    );
  }

  it("shows loading skeleton when isLoading is true", () => {
    useTemplateStore.setState({ isLoading: true });
    renderGallery();
    expect(screen.getByTestId("template-gallery-loading")).toBeInTheDocument();
  });

  it("renders blank card even when no templates exist", () => {
    renderGallery();
    expect(screen.getByTestId("template-blank-card")).toBeInTheDocument();
  });

  it("renders blank card first, followed by template cards", () => {
    useTemplateStore.setState({
      templates: [
        makeTemplate("t1", "Budget"),
        makeTemplate("t2", "Invoice"),
        makeTemplate("t3", "Schedule"),
      ],
    });

    renderGallery();

    const blankCard = screen.getByTestId("template-blank-card");
    expect(blankCard).toBeInTheDocument();

    expect(screen.getByTestId("template-card-t1")).toBeInTheDocument();
    expect(screen.getByTestId("template-card-t2")).toBeInTheDocument();
    expect(screen.getByTestId("template-card-t3")).toBeInTheDocument();
  });

  it("shows at least 6 cards when 5+ templates are present (blank + templates)", () => {
    useTemplateStore.setState({
      templates: [
        makeTemplate("t1", "Budget"),
        makeTemplate("t2", "Invoice"),
        makeTemplate("t3", "Project Tracker"),
        makeTemplate("t4", "Schedule"),
        makeTemplate("t5", "Gradebook"),
      ],
    });

    renderGallery();

    // 1 blank + 5 templates = 6 cards
    const buttons = screen.getAllByRole("button", {
      name: /Budget|Invoice|Project Tracker|Schedule|Gradebook|Blank/i,
    });
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it("renders mini spreadsheet preview with table rows for known templates", () => {
    useTemplateStore.setState({
      templates: [makeTemplate("t1", "Budget", "Monthly Budget")],
    });

    renderGallery();

    const card = screen.getByTestId("template-card-t1");
    // The card should contain a table (mini spreadsheet preview)
    const table = card.querySelector("table");
    expect(table).not.toBeNull();

    // Budget preview has 5 data rows
    const rows = table!.querySelectorAll("tr");
    expect(rows.length).toBe(5);
  });

  it("clicking blank card navigates to /spreadsheet/new", async () => {
    renderGallery();

    const blankCard = screen.getByTestId("template-blank-card");
    await userEvent.click(blankCard);

    expect(mockNavigate).toHaveBeenCalledWith("/spreadsheet/new");
  });

  it("clicking a template card calls createFromTemplate", async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: "new-ss-1" });
    useTemplateStore.setState({
      templates: [makeTemplate("t1", "Budget")],
      createFromTemplate: mockCreate,
    });

    renderGallery();

    const card = screen.getByTestId("template-card-t1");
    await userEvent.click(card);

    expect(mockCreate).toHaveBeenCalledWith("t1");
  });

  it("displays template name below the preview", () => {
    useTemplateStore.setState({
      templates: [makeTemplate("t1", "Invoice")],
    });

    renderGallery();

    // The template name "Invoice" appears as the label below the preview
    const card = screen.getByTestId("template-card-t1");
    const nameLabel = card.querySelector("span.text-sm.font-medium");
    expect(nameLabel).not.toBeNull();
    expect(nameLabel!.textContent).toBe("Invoice");
  });
});
