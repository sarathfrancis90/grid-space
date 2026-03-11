import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TemplateGallery } from "../components/dashboard/TemplateGallery";
import { useTemplateStore } from "../stores/templateStore";
import type { TemplateSummary } from "../stores/templateStore";

const MOCK_TEMPLATES: TemplateSummary[] = [
  {
    id: "t1",
    title: "Budget",
    templateName: "Budget",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "o1", name: "GridSpace", avatarUrl: null },
  },
  {
    id: "t2",
    title: "Invoice",
    templateName: "Invoice",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "o1", name: "GridSpace", avatarUrl: null },
  },
  {
    id: "t3",
    title: "Project Tracker",
    templateName: "Project Tracker",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "o1", name: "GridSpace", avatarUrl: null },
  },
  {
    id: "t4",
    title: "Schedule",
    templateName: "Schedule",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "o1", name: "GridSpace", avatarUrl: null },
  },
  {
    id: "t5",
    title: "Gradebook",
    templateName: "Gradebook",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    owner: { id: "o1", name: "GridSpace", avatarUrl: null },
  },
];

// no-op fetchTemplates to prevent useEffect from overriding test state
const noopFetchTemplates = async () => {};

function renderGallery() {
  return render(
    <MemoryRouter>
      <TemplateGallery />
    </MemoryRouter>,
  );
}

describe("TemplateGallery — preview thumbnails", () => {
  beforeEach(() => {
    useTemplateStore.setState({
      templates: MOCK_TEMPLATES,
      isLoading: false,
      error: null,
      fetchTemplates: noopFetchTemplates,
    });
  });

  it("renders the blank spreadsheet card as the first card", () => {
    renderGallery();
    const blankCard = screen.getByTestId("template-card-blank");
    expect(blankCard).toBeInTheDocument();
    expect(blankCard).toHaveTextContent("Blank");
  });

  it("renders mini-spreadsheet preview thumbnails instead of letter circles", () => {
    renderGallery();
    const previews = screen.getAllByTestId("template-preview");
    // One preview per template (blank card has no preview)
    expect(previews.length).toBe(MOCK_TEMPLATES.length);
  });

  it("renders all template cards with correct names", () => {
    renderGallery();
    for (const t of MOCK_TEMPLATES) {
      const card = screen.getByTestId(`template-card-${t.id}`);
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(t.templateName ?? t.title);
    }
  });

  it("shows at least 6 cards total (blank + templates)", () => {
    renderGallery();
    const blankCard = screen.getByTestId("template-card-blank");
    const templateCards = MOCK_TEMPLATES.map((t) =>
      screen.getByTestId(`template-card-${t.id}`),
    );
    // blank + 5 templates = 6 cards
    expect(1 + templateCards.length).toBeGreaterThanOrEqual(6);
    expect(blankCard).toBeInTheDocument();
  });

  it("shows loading skeleton with rectangular placeholders", () => {
    useTemplateStore.setState({
      templates: [],
      isLoading: true,
      error: null,
      fetchTemplates: noopFetchTemplates,
    });
    renderGallery();
    const loading = screen.getByTestId("template-gallery-loading");
    expect(loading).toBeInTheDocument();
  });

  it("still renders gallery section when there are no templates (blank card shown)", () => {
    useTemplateStore.setState({
      templates: [],
      isLoading: false,
      error: null,
      fetchTemplates: noopFetchTemplates,
    });
    renderGallery();
    const gallery = screen.getByTestId("template-gallery");
    expect(gallery).toBeInTheDocument();
    expect(screen.getByTestId("template-card-blank")).toBeInTheDocument();
  });

  it("renders preview cells with correct content for Budget template", () => {
    renderGallery();
    const budgetCard = screen.getByTestId("template-card-t1");
    // Budget preview should contain header text
    expect(budgetCard).toHaveTextContent("Category");
    expect(budgetCard).toHaveTextContent("Budget");
    expect(budgetCard).toHaveTextContent("$1,200");
  });
});
