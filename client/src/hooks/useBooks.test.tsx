import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
const firstDummyBook = dummyBooks[0]!;

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

function QueryTestComponent({ query }: { query?: { keyword?: string } }) {
  const { books, loading } = useBooks(query);

  if (loading) return <div>loading</div>;

  return <div>{books.map((b) => b.title).join(",")}</div>;
}

describe("useBooks hook", () => {
  beforeEach(() => {
    (apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("読み込み状態から始まりデータをレンダリングする", async () => {
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

  it("ボタンクリックでリフレッシュできる", async () => {
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

    fireEvent.click(screen.getByText("refresh"));

    await waitFor(() => {
      expect(screen.getByText(/Test A/)).toBeInTheDocument();
    });

    expect(
      (apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0],
    ).toBeUndefined();
  });

  it("API が失敗したときエラーを表示する", async () => {
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new ApiHttpError(500, "server error"));

    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText(/error:/)).toBeInTheDocument());
    expect(
      screen.getByText(new RegExp(BOOK_LIST_ERROR_MESSAGES.SERVER_ERROR)),
    ).toBeInTheDocument();
  });

  it("レスポンスペイロードが想定外のとき不明なエラーを表示する", async () => {
    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: {} });

    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText(/error:/)).toBeInTheDocument());
    expect(
      screen.getByText(new RegExp(BOOK_LIST_ERROR_MESSAGES.UNKNOWN)),
    ).toBeInTheDocument();
  });

  it("古いリクエスト結果で新しい状態を上書きしない", async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    let resolveSecond: ((value: unknown) => void) | undefined;

    (
      apiClient.searchBooks as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(({ keyword }: { keyword?: string } = {}) => {
      return new Promise((resolve) => {
        if (keyword === "new") {
          resolveSecond = resolve;
          return;
        }

        resolveFirst = resolve;
      });
    });

    const { rerender } = render(<QueryTestComponent query={{ keyword: "old" }} />);
    rerender(<QueryTestComponent query={{ keyword: "new" }} />);

    resolveSecond?.({
      data: {
        books: [{ ...firstDummyBook, id: 2, title: "New Book" }],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText("New Book")).toBeInTheDocument();
    });

    resolveFirst?.({
      data: {
        books: [{ ...firstDummyBook, id: 3, title: "Old Book" }],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText("New Book")).toBeInTheDocument();
      expect(screen.queryByText("Old Book")).not.toBeInTheDocument();
    });
  });
});
