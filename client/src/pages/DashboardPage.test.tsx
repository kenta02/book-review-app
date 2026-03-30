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
      searchBooks: vi.fn(),
    },
  };
});

// Vitest runs in a node-like environment; the Header component reads from
// localStorage which isn't provided by default.  Provide a simple in-memory
// stub so that rendering pages containing <Header> does not throw a
// SecurityError.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

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
    // reset api mock and localStorage stub
    (apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>).mockReset();
    (apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>).mockReset();
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    globalThis.localStorage.clear();
  });

  it("renders loading and then book cards", async () => {
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: {
        books: sample,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      },
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
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("err"));
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Error:/)).toBeInTheDocument());
  });

  it("renders search controls and filter inputs", async () => {
    // resolve empty list so we don't need cards
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: {
        books: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    // wait for loading to finish
    await waitFor(() =>
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(),
    );

    expect(
      screen.getByRole("textbox", { name: /書籍名、著者名、要約で検索/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("clear-filters-button")).toBeInTheDocument();
    expect(screen.getByTestId("search-button")).toBeInTheDocument();
    expect(screen.getByLabelText(/評価/)).toBeInTheDocument();
    expect(screen.getByLabelText(/出版年 From/)).toBeInTheDocument();
    expect(screen.getByLabelText(/出版年 to/)).toBeInTheDocument();
    expect(screen.getByLabelText(/並び替え/)).toBeInTheDocument();
  });
});
