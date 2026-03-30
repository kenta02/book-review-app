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
      searchBooks: vi.fn(),
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
  const { books, loading, errorCode, refresh } = useBooks();

  // ローディング中の表示
  if (loading) return <div>loading</div>;

  // エラー発生時の表示
  if (errorCode) return <div>error: {BOOK_LIST_ERROR_MESSAGES[errorCode]}</div>;

  // 通常表示（書籍リスト）
  return (
    <>
      <button onClick={refresh}>refresh</button>
      <div>{books.map((b) => b.title).join(",")}</div>
    </>
  );
}

describe("useBooks hook", () => {
  beforeEach(() => {
    (apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("starts in loading state then renders data", async () => {
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      data: {
        books: dummyBooks,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      },
    });

    render(<TestComponent />);
    expect(screen.getByText(/loading/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Test A/)).toBeInTheDocument();
    });
  });

  it("can refresh on button click", async () => {
    // 初回は空データ、二回目はbooksを返す
    (apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        data: {
          books: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          books: dummyBooks,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10,
          },
        },
      });

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText(/Test A/)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("refresh")).toBeInTheDocument();
    });

    screen.getByText("refresh").click();

    await waitFor(() => {
      expect(screen.getByText(/Test A/)).toBeInTheDocument();
    });
  });

  it("shows error when api fails", async () => {
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new ApiHttpError(500, "server error"));

    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText(/error:/)).toBeInTheDocument());
    expect(
      screen.getByText(new RegExp(BOOK_LIST_ERROR_MESSAGES.SERVER_ERROR)),
    ).toBeInTheDocument();
  });

  it("shows unknown error when response payload is unexpected", async () => {
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: {} });

    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText(/error:/)).toBeInTheDocument());
    expect(
      screen.getByText(new RegExp(BOOK_LIST_ERROR_MESSAGES.UNKNOWN)),
    ).toBeInTheDocument();
  });
});
