import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AboutDialog } from "../AboutDialog";
import { WhatsNewDialog } from "../WhatsNewDialog";

describe("AboutDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <AboutDialog open={false} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders version and title when open", () => {
    render(<AboutDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId("about-dialog")).toBeInTheDocument();
    expect(screen.getByText("GridSpace")).toBeInTheDocument();
    expect(screen.getByText("Version 0.1.0")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<AboutDialog open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("about-dialog-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(<AboutDialog open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("about-dialog-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("WhatsNewDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <WhatsNewDialog open={false} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders release notes when open", () => {
    render(<WhatsNewDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByTestId("whats-new-dialog")).toBeInTheDocument();
    expect(screen.getByText("What's New")).toBeInTheDocument();
    expect(screen.getByText("v0.1.0")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<WhatsNewDialog open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("whats-new-dialog-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
