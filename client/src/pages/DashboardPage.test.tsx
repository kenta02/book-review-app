import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { DashboardPage } from "./DashBoard";
import { MemoryRouter } from "react-router-dom";
import type { Book } from "../types";

vi.mock("../api/apiClient", () => {
  return {
    apiClient: {
      getAllBooks: vi.fn(),
    },
  };
});

const sample: Book[] = [
  {
    id: 100,
    title: "Sample",
    author: "X",
    publicationYear: 2000,
    ISBN: "123",
    summary: "s",
    createdAt: "",
    updatedAt: "",
  },
];

describe("DashboardPage", () => {
  beforeEach(() => {
    (apiClient.getAllBooks as unknown as vi.Mock).mockReset();
  });

  it("renders loading and then book cards", async () => {
    (apiClient.getAllBooks as unknown as vi.Mock).mockResolvedValue({
      data: { books: sample },
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    await waitFor(() => {
      const items = screen.getAllByText(/Sample/);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it("shows error message when request fails", async () => {
    (apiClient.getAllBooks as unknown as vi.Mock).mockRejectedValue(
      new Error("err"),
    );
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Error:/)).toBeInTheDocument());
  });
});
