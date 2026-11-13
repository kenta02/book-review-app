import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../api/apiClient";
import { DashboardPage } from "./DashBoard";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { Book } from "../types";
import { ApiHttpError } from "../errors/AppError";

// ヘッダーが読む認証状態を固定する（このテストの関心は認証ではないため）
// 書籍カードの「削除」は権限で出し分けるため、ログインユーザーはテストごとに差し替える
let currentUser: {
  id: number;
  username: string;
  email: string;
  role: string;
} | null = null;
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({
    user: currentUser,
    status: currentUser ? "authenticated" : "unauthenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../api/apiClient", () => {
  return {
    apiClient: {
      getAllBooks: vi.fn(),
      searchBooks: vi.fn(),
      deleteBook: vi.fn(),
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
    (apiClient.deleteBook as unknown as ReturnType<typeof vi.fn>).mockReset();
    currentUser = null;
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

  it("URL クエリパラメータの不正な数値は安全な既定値に丸める", async () => {
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
      <MemoryRouter
        initialEntries={[
          "/dashboard?page=0&limit=-1&ratingMin=4.4&publicationYearFrom=-2000&sort=title&order=desc",
        ]}
      >
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(searchBooksMock.mock.calls.length).toBeGreaterThan(0),
    );

    expect(searchBooksMock.mock.calls.at(-1)?.[0]).toEqual({
      page: 1,
      limit: 20,
      keyword: "",
      sort: "title",
      order: "desc",
    });
    expect(screen.getByLabelText(/評価/)).toHaveValue("");
    expect(screen.getByLabelText(/並び替え/)).toHaveValue("title-desc");
  });
});

/**
 * テスト用: 現在の URL（pathname + search）を画面に出して検証できるようにする。
 */
function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

describe("DashboardPage 検索ボタンと URL クエリ同期", () => {
  const searchBooksMock = apiClient.searchBooks as unknown as ReturnType<
    typeof vi.fn
  >;

  /** 検索 API の成功レスポンス（books を差し替えて使う） */
  const okResponse = (books: Book[]) => ({
    data: {
      books,
      pagination: {
        currentPage: 1,
        totalPages: books.length === 0 ? 0 : 1,
        totalItems: books.length,
        itemsPerPage: 20,
      },
    },
  });

  /** Dashboard と URL 表示を MemoryRouter 内に描画する */
  const renderDashboard = (initialEntry = "/dashboard") =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <DashboardPage />
        <LocationProbe />
      </MemoryRouter>,
    );

  const keywordInput = () =>
    screen.getByRole("textbox", { name: /書籍名、著者名、要約で検索/ });

  const waitForIdle = () =>
    waitFor(() =>
      expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(),
    );

  beforeEach(() => {
    searchBooksMock.mockReset();
    currentUser = null;
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    globalThis.localStorage.clear();
  });

  it("検索ボタンで検索条件が URL に反映される", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard();
    await waitForIdle();

    fireEvent.change(keywordInput(), { target: { value: "Sample" } });
    fireEvent.change(screen.getByLabelText(/評価/), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/並び替え/), {
      target: { value: "title-asc" },
    });
    fireEvent.click(screen.getByTestId("search-button"));

    await waitFor(() => {
      const url = new URL(
        `http://localhost${screen.getByTestId("location").textContent}`,
      );
      expect(url.pathname).toBe("/dashboard");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        keyword: "Sample",
        ratingMin: "4",
        sort: "title",
        order: "asc",
        page: "1",
        limit: "20",
      });
    });
  });

  it("入力するだけでは検索されず、URL も変わらない", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard();
    await waitForIdle();
    const callCount = searchBooksMock.mock.calls.length;

    fireEvent.change(keywordInput(), { target: { value: "Sample" } });

    expect(searchBooksMock.mock.calls.length).toBe(callCount);
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/dashboard$/);
  });

  it("検索ボタンは submit で、フォーム送信（Enter 相当）でも検索される", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard();
    await waitForIdle();

    // ブラウザでは submit ボタンのあるフォーム内の Enter が送信になる。
    expect(screen.getByTestId("search-button")).toHaveAttribute(
      "type",
      "submit",
    );

    fireEvent.change(keywordInput(), { target: { value: "Enter検索" } });
    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() => {
      expect(searchBooksMock.mock.calls.at(-1)?.[0]).toMatchObject({
        keyword: "Enter検索",
      });
      expect(screen.getByTestId("location")).toHaveTextContent(
        "keyword=Enter%E6%A4%9C%E7%B4%A2",
      );
    });
  });

  it("検索 1 回につき API リクエストは 1 回だけ（二重取得しない）", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard();
    await waitForIdle();
    const callCount = searchBooksMock.mock.calls.length;

    fireEvent.change(keywordInput(), { target: { value: "Sample" } });
    fireEvent.click(screen.getByTestId("search-button"));
    await waitForIdle();

    expect(searchBooksMock.mock.calls.length).toBe(callCount + 1);
  });

  it("URL に条件がある状態で開いても、最初のリクエストから URL の条件で取得する", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard(
      "/dashboard?keyword=Sample&ratingMin=4&sort=title&order=asc",
    );
    await waitForIdle();

    // 既定条件での無駄なリクエストが先に飛ばない
    expect(searchBooksMock).toHaveBeenCalledTimes(1);
    expect(searchBooksMock.mock.calls[0]?.[0]).toMatchObject({
      keyword: "Sample",
      ratingMin: 4,
      sort: "title",
      order: "asc",
    });
  });

  it("検索すると page は 1 に戻る", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard("/dashboard?keyword=old&page=3");
    await waitForIdle();

    fireEvent.change(keywordInput(), { target: { value: "new" } });
    fireEvent.click(screen.getByTestId("search-button"));

    await waitFor(() => {
      expect(searchBooksMock.mock.calls.at(-1)?.[0]).toMatchObject({
        keyword: "new",
        page: 1,
      });
    });
  });

  it("同じ条件で再検索すると URL はそのままで再取得する", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard("/dashboard?keyword=Sample");
    await waitForIdle();
    const callCount = searchBooksMock.mock.calls.length;
    const urlBefore = screen.getByTestId("location").textContent;

    fireEvent.click(screen.getByTestId("search-button"));

    await waitFor(() =>
      expect(searchBooksMock.mock.calls.length).toBe(callCount + 1),
    );
    expect(screen.getByTestId("location").textContent).toBe(urlBefore);
  });

  it("検索後の URL で開き直すと同じ条件・同じ結果になる（リロード相当）", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    const first = renderDashboard();
    await waitForIdle();

    fireEvent.change(keywordInput(), { target: { value: "Sample" } });
    fireEvent.change(screen.getByLabelText(/出版年 From/), {
      target: { value: "1990" },
    });
    fireEvent.click(screen.getByTestId("search-button"));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "keyword=Sample",
      ),
    );
    const searchedUrl = screen.getByTestId("location").textContent ?? "";
    const searchedQuery = searchBooksMock.mock.calls.at(-1)?.[0];
    first.unmount();
    searchBooksMock.mockClear();

    // 同じ URL で開き直す
    renderDashboard(searchedUrl);
    await waitForIdle();

    expect(searchBooksMock).toHaveBeenCalledTimes(1);
    expect(searchBooksMock.mock.calls[0]?.[0]).toEqual(searchedQuery);
    expect(keywordInput()).toHaveValue("Sample");
    expect(screen.getByLabelText(/出版年 From/)).toHaveValue(1990);
    expect(screen.getAllByText(/Sample/).length).toBeGreaterThan(0);
  });

  it("クリアすると入力欄と URL が初期状態に戻る", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard("/dashboard?keyword=Sample&ratingMin=4");
    await waitForIdle();

    fireEvent.click(screen.getByTestId("clear-filters-button"));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/dashboard$/);
      expect(keywordInput()).toHaveValue("");
      expect(screen.getByLabelText(/評価/)).toHaveValue("");
    });
  });

  it("URL が空のとき、未検索の入力もクリアで消える", async () => {
    searchBooksMock.mockResolvedValue(okResponse(sample));
    renderDashboard();
    await waitForIdle();

    fireEvent.change(keywordInput(), { target: { value: "未検索の入力" } });
    fireEvent.click(screen.getByTestId("clear-filters-button"));

    await waitFor(() => expect(keywordInput()).toHaveValue(""));
  });

  it("検索中は Loading 表示で、検索フォームは残る", async () => {
    // 解決しない Promise で「検索中」の状態を作る
    searchBooksMock.mockReturnValue(new Promise(() => {}));
    renderDashboard();

    expect(await screen.findByText(/Loading/)).toBeInTheDocument();
    expect(screen.getByTestId("search-button")).toBeInTheDocument();
  });

  it("0 件のときは「見つかりませんでした」を表示する", async () => {
    searchBooksMock.mockResolvedValue(okResponse([]));
    renderDashboard("/dashboard?keyword=存在しない");
    await waitForIdle();

    expect(
      screen.getByText("書籍が見つかりませんでした。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it("エラー時も検索フォームは残り、条件を変えて再検索すると復帰できる", async () => {
    searchBooksMock
      .mockRejectedValueOnce(new Error("err"))
      .mockResolvedValue(okResponse(sample));
    renderDashboard();

    expect(await screen.findByText(/Error:/)).toBeInTheDocument();
    // エラーと 0 件表示が同時に出ない
    expect(
      screen.queryByText("書籍が見つかりませんでした。"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("search-button")).toBeInTheDocument();

    fireEvent.change(keywordInput(), { target: { value: "Sample" } });
    fireEvent.click(screen.getByTestId("search-button"));

    await waitFor(() => {
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Sample/).length).toBeGreaterThan(0);
    });
  });

  describe("書籍カードの削除（管理者のみ）", () => {
    const deleteBookMock = () =>
      apiClient.deleteBook as unknown as ReturnType<typeof vi.fn>;

    beforeEach(() => {
      searchBooksMock.mockReset();
      searchBooksMock.mockResolvedValue(okResponse(sample));
    });

    it("一般ユーザーにはカードの「削除」を表示しない", async () => {
      currentUser = { id: 2, username: "john", email: "e", role: "user" };
      renderDashboard();
      await screen.findByTestId("book-card");

      expect(
        screen.queryByRole("button", { name: "削除" }),
      ).not.toBeInTheDocument();
    });

    it("管理者が削除すると、一覧を再取得して表示を更新する", async () => {
      currentUser = { id: 1, username: "admin", email: "e", role: "admin" };
      deleteBookMock().mockResolvedValue(undefined);
      renderDashboard();
      await screen.findByTestId("book-card");
      expect(searchBooksMock).toHaveBeenCalledTimes(1);

      // 削除後の再取得では、その書籍が一覧から消えている
      searchBooksMock.mockResolvedValue(okResponse([]));
      fireEvent.click(screen.getByRole("button", { name: "削除" }));
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      await waitFor(() => expect(searchBooksMock).toHaveBeenCalledTimes(2));
      expect(deleteBookMock()).toHaveBeenCalledWith(100);
      await waitFor(() =>
        expect(screen.queryByTestId("book-card")).not.toBeInTheDocument(),
      );
    });

    it("409 のときはエラーを表示し、一覧は再取得しない", async () => {
      currentUser = { id: 1, username: "admin", email: "e", role: "admin" };
      deleteBookMock().mockRejectedValue(new ApiHttpError(409, "conflict"));
      renderDashboard();
      await screen.findByTestId("book-card");

      fireEvent.click(screen.getByRole("button", { name: "削除" }));
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "関連データがあるため、この書籍は削除できません",
      );
      expect(searchBooksMock).toHaveBeenCalledTimes(1);
    });
  });
});
