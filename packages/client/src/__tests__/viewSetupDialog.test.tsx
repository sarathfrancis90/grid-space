import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewSetupDialog } from "../components/views/ViewSetupDialog";

const HEADERS = ["Status", "Title", "Description", "Color"];

describe("ViewSetupDialog", () => {
  it("renders inline without fixed positioning", () => {
    const onApply = vi.fn();
    const onCancel = vi.fn();

    render(
      <ViewSetupDialog
        viewType="kanban"
        headers={HEADERS}
        onApply={onApply}
        onCancel={onCancel}
      />,
    );

    const backdrop = screen.getByTestId("view-setup-backdrop");
    expect(backdrop.className).not.toContain("fixed");
    expect(backdrop.className).not.toContain("inset-0");
    expect(backdrop.className).toContain("flex");
  });

  it("renders the setup dialog with correct title", () => {
    render(
      <ViewSetupDialog
        viewType="kanban"
        headers={HEADERS}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Kanban Setup")).toBeTruthy();
  });

  it("renders timeline setup title", () => {
    render(
      <ViewSetupDialog
        viewType="timeline"
        headers={HEADERS}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Timeline Setup")).toBeTruthy();
  });

  it("renders calendar setup title", () => {
    render(
      <ViewSetupDialog
        viewType="calendar"
        headers={HEADERS}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Calendar Setup")).toBeTruthy();
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();

    render(
      <ViewSetupDialog
        viewType="kanban"
        headers={HEADERS}
        onApply={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTestId("setup-cancel-btn"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onApply with config when Apply is clicked", () => {
    const onApply = vi.fn();

    render(
      <ViewSetupDialog
        viewType="kanban"
        headers={HEADERS}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("setup-apply-btn"));
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCol: expect.any(Number),
        titleCol: expect.any(Number),
      }),
    );
  });

  it("renders column selects for each field", () => {
    render(
      <ViewSetupDialog
        viewType="kanban"
        headers={HEADERS}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("setup-select-statusCol")).toBeTruthy();
    expect(screen.getByTestId("setup-select-titleCol")).toBeTruthy();
    expect(screen.getByTestId("setup-select-descCol")).toBeTruthy();
    expect(screen.getByTestId("setup-select-colorCol")).toBeTruthy();
  });
});
