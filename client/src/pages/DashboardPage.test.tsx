import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardPage } from "./DashBoard";
import { MemoryRouter } from "react-router-dom";

// no need to mock apiClient because current implementation is static

describe("DashboardPage", () => {
  it("renders main heading and sample cards", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/書籍ダッシュボード/)).toBeInTheDocument();
    // at least one of the hard-coded book titles should appear
    const titles = screen.getAllByText(/人を動かす/);
    expect(titles.length).toBeGreaterThan(0);
  });

  it("toggles filter panel when filter button is clicked", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    const filterBtn = screen.getByRole("button", { name: /フィルター/ });
    expect(screen.queryByText(/出版年/)).not.toBeInTheDocument();

    fireEvent.click(filterBtn);
    expect(screen.getByText(/出版年/)).toBeInTheDocument();

    fireEvent.click(filterBtn);
    expect(screen.queryByText(/出版年/)).not.toBeInTheDocument();
  });
});
