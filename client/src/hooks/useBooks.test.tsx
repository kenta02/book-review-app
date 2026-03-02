import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { useBooks } from "./useBooks";
import type { Book } from "../types";

vi.mock("../api/apiClient", () => {
  return {
    apiClient: {
      getAllBooks: vi.fn(),
    },
  };
});

const dummyBooks: Book[] = [
  {
    id: 1,
    title: "Test A",
    author: "Author A",
    publicationYear: 2020,
    ISBN: "111",
    summary: "s",
    createdAt: "",
    updatedAt: "",
  },
];

// helper component that uses the hook
function TestComponent() {
  const { books, loading, error } = useBooks();
  if (loading) return <div>loading</div>;
  if (error) return <div>error: {error}</div>;
  return <div>{books.map((b) => b.title).join(",")}</div>;
}

describe("useBooks hook", () => {
  beforeEach(() => {
    (apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("starts in loading state then renders data", async () => {
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: { books: dummyBooks },
    });

    render(<TestComponent />);
    expect(screen.getByText(/loading/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Test A/)).toBeInTheDocument();
    });
  });

  it("shows error when api fails", async () => {
    (
      apiClient.getAllBooks as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("fail"));

    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText(/error:/)).toBeInTheDocument());
  });
});
