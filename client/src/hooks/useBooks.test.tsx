import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { ApiHttpError } from "../errors/AppError";
import { BOOK_LIST_ERROR_MESSAGES } from "../constants/messages";
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
  const { books, loading, errorCode } = useBooks();
  if (loading) return <div>loading</div>;
  if (errorCode) return <div>error: {BOOK_LIST_ERROR_MESSAGES[errorCode]}</div>;
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
    ).mockRejectedValue(new ApiHttpError(500, "server error"));

    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText(/error:/)).toBeInTheDocument());
    expect(
      screen.getByText(new RegExp(BOOK_LIST_ERROR_MESSAGES.SERVER_ERROR)),
    ).toBeInTheDocument();
  });
});
