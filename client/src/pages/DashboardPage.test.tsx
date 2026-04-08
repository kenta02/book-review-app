import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("読み込み後に書籍カードをレンダリングする", async () => {
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

  it("リクエスト失敗時にエラーメッセージを表示する", async () => {
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

  it("検索コントロールとフィルター入力をレンダリングする", async () => {
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

  it("検索ボタンがクリックされたときクエリを更新して searchBooks を呼ぶ", async () => {
    const searchBooksMock = apiClient.searchBooks as unknown as ReturnType<
      typeof vi.fn
    >;
    searchBooksMock
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

    await waitFor(() =>
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(),
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /書籍名、著者名、要約で検索/ }),
      { target: { value: "Sample" } },
    );
    fireEvent.change(screen.getByLabelText(/評価/), {
      target: { value: "4" },
    });
    const previousCallCount = searchBooksMock.mock.calls.length;
    fireEvent.click(screen.getByTestId("search-button"));

    await waitFor(() => {
      expect(searchBooksMock.mock.calls.length).toBeGreaterThan(
        previousCallCount,
      );
      expect(searchBooksMock.mock.calls.at(-1)?.[0]).toEqual({
        page: 1,
        limit: 20,
        keyword: "Sample",
        ratingMin: 4,
        sort: "createdAt",
        order: "desc",
      });
    });
  });

  it("クリアボタンがクリックされたときクエリと入力をリセットする", async () => {
    const searchBooksMock = apiClient.searchBooks as unknown as ReturnType<
      typeof vi.fn
    >;
    searchBooksMock.mockResolvedValue({
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

    await waitFor(() =>
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(),
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /書籍名、著者名、要約で検索/ }),
      { target: { value: "Sample" } },
    );
    fireEvent.change(screen.getByLabelText(/評価/), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByTestId("search-button"));

    await waitFor(() =>
      expect(searchBooksMock.mock.calls.length).toBeGreaterThan(1),
    );

    fireEvent.click(screen.getByTestId("clear-filters-button"));

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: /書籍名、著者名、要約で検索/ }),
      ).toHaveValue("");
      expect(screen.getByLabelText(/評価/)).toHaveValue("");
      expect(searchBooksMock.mock.calls.length).toBeGreaterThan(2);
      expect(searchBooksMock.mock.calls.at(-1)?.[0]).toEqual({
        page: 1,
        limit: 20,
        keyword: "",
        sort: "createdAt",
        order: "desc",
      });
    });
  });

  it("URL クエリパラメータからフィルタを初期化する", async () => {
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
      <MemoryRouter
        initialEntries={[
          "/dashboard?keyword=Sample&ratingMin=4&sort=title&order=asc",
        ]}
      >
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(),
    );

    expect(
      screen.getByRole("textbox", { name: /書籍名、著者名、要約で検索/ }),
    ).toHaveValue("Sample");
    expect(screen.getByLabelText(/評価/)).toHaveValue("4");
    expect(screen.getByLabelText(/並び替え/)).toHaveValue("title-asc");
  });
});
