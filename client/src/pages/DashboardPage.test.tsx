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
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    window.localStorage.clear();
  });

  it("renders loading and then book cards", async () => {
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
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
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("err"));
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/Error:/)).toBeInTheDocument());
  });
});
