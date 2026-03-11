import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TemplateGallery } from "../components/dashboard/TemplateGallery";
import {
  useTemplateStore,
  type TemplateSummary,
} from "../stores/templateStore";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeMockTemplate(
  overrides: Partial<TemplateSummary> = {},
): TemplateSummary {
  return {
    id: "tpl-1",
    title: "Budget Template",
    templateName: "Budget",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "owner-1", name: "GridSpace", avatarUrl: null },
    ...overrides,
  };
}

function renderGallery() {
  return render(
    <MemoryRouter>
      <TemplateGallery />
    </MemoryRouter>,
  );
}

describe("TemplateGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override fetchTemplates to be a no-op so useEffect doesn't flip isLoading
    useTemplateStore.setState({
      templates: [],
      isLoading: false,
      error: null,
      fetchTemplates: vi.fn(),
    });
  });

  it("renders blank spreadsheet card as first item", () => {
    useTemplateStore.setState({
      templates: [makeMockTemplate()],
      isLoading: false,
    });
    renderGallery();
    const blankCard = screen.getByTestId("template-card-blank");
    expect(blankCard).toBeDefined();
    expect(screen.getByText("Blank")).toBeDefined();
    expect(screen.getByText("Empty spreadsheet")).toBeDefined();
  });

  it("renders template cards with SVG preview thumbnails", () => {
    const templates = [
      makeMockTemplate({ id: "tpl-1", templateName: "Budget" }),
      makeMockTemplate({ id: "tpl-2", templateName: "Invoice" }),
      makeMockTemplate({ id: "tpl-3", templateName: "Project Tracker" }),
    ];
    useTemplateStore.setState({ templates, isLoading: false });
    renderGallery();

    expect(screen.getByTestId("template-card-tpl-1")).toBeDefined();
    expect(screen.getByTestId("template-card-tpl-2")).toBeDefined();
    expect(screen.getByTestId("template-card-tpl-3")).toBeDefined();

    // Each card should have an SVG preview (role="img")
    const previews = screen.getAllByRole("img");
    expect(previews.length).toBeGreaterThanOrEqual(3);
  });

  it("renders at least 6 items when templates are available (blank + 5 templates)", () => {
    const templates = [
      makeMockTemplate({ id: "tpl-1", templateName: "Budget" }),
      makeMockTemplate({ id: "tpl-2", templateName: "Invoice" }),
      makeMockTemplate({ id: "tpl-3", templateName: "Project Tracker" }),
      makeMockTemplate({ id: "tpl-4", templateName: "Schedule" }),
      makeMockTemplate({ id: "tpl-5", templateName: "Gradebook" }),
    ];
    useTemplateStore.setState({ templates, isLoading: false });
    renderGallery();

    // Blank card + 5 templates = 6 cards total
    const blankCard = screen.getByTestId("template-card-blank");
    expect(blankCard).toBeDefined();
    templates.forEach((t) => {
      expect(screen.getByTestId(`template-card-${t.id}`)).toBeDefined();
    });
  });

  it("shows loading skeletons when loading", () => {
    useTemplateStore.setState({ templates: [], isLoading: true });
    renderGallery();
    expect(screen.getByTestId("template-gallery-loading")).toBeDefined();
  });

  it("shows gallery even with no templates (blank card still visible)", () => {
    useTemplateStore.setState({ templates: [], isLoading: false });
    renderGallery();
    expect(screen.getByTestId("template-gallery")).toBeDefined();
    expect(screen.getByTestId("template-card-blank")).toBeDefined();
  });

  it("displays template name and owner below preview thumbnail", () => {
    useTemplateStore.setState({
      templates: [makeMockTemplate({ id: "tpl-1", templateName: "Budget" })],
      isLoading: false,
    });
    renderGallery();
    // "Budget" appears in both SVG preview cells and the card label
    const budgetTexts = screen.getAllByText("Budget");
    expect(budgetTexts.length).toBeGreaterThanOrEqual(1);
    // The card label span should exist
    const card = screen.getByTestId("template-card-tpl-1");
    const nameSpan = card.querySelector(".text-sm.font-medium.text-gray-800");
    expect(nameSpan?.textContent).toBe("Budget");
    expect(screen.getByText("GridSpace")).toBeDefined();
  });

  it("renders preview with aria-label for accessibility", () => {
    useTemplateStore.setState({
      templates: [makeMockTemplate({ id: "tpl-1", templateName: "Budget" })],
      isLoading: false,
    });
    renderGallery();
    const preview = screen.getByLabelText("Budget preview");
    expect(preview).toBeDefined();
    expect(preview.tagName.toLowerCase()).toBe("svg");
  });
});
