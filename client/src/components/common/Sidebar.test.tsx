import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders overlay when open and calls onClose when clicked", () => {
    const onClose = vi.fn();

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>,
    );

    const overlay = screen.getByTestId("sidebar-overlay");
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render overlay when closed", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar isOpen={false} />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("sidebar-overlay")).toBeNull();
  });

  it("highlights the active route", () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole("link", { name: /設定/ });
    expect(activeLink).toHaveClass("font-semibold");
  });
});
