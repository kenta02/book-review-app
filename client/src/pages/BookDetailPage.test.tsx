import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookDetailPage } from "./BookDetailPage";
import { apiClient } from "../api/apiClient";
import { ApiHttpError } from "../errors/AppError";

// 削除の導線は権限で出し分けるため、ログインユーザーをテストごとに差し替える
const mockUseAuth = vi.fn();
vi.mock("../auth/useAuth", () => ({ useAuth: () => mockUseAuth() }));

const asUser = (role: "user" | "admin" | null) =>
  mockUseAuth.mockReturnValue({
    user: role === null ? null : { id: 1, username: "u", email: "e", role },
    status: role === null ? "unauthenticated" : "authenticated",
  });

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ bookId: "1" });

vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual(
    "react-router-dom",
  )) as typeof import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

vi.mock("../components/layouts/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

vi.mock("../components/books/BookInfoDetail", () => ({
  BookInfoDetail: ({ book }: { book: unknown }) => (
    <div data-testid="book-info-detail">{JSON.stringify(book)}</div>
  ),
}));

vi.mock("../components/books/ReviewSectionDetail", () => ({
  ReviewSectionDetail: ({
    reviews,
    bookId,
    onReviewChanged,
  }: {
    reviews: unknown;
    bookId: number;
    onReviewChanged: () => void;
  }) => (
    <div data-testid="review-section-detail" data-book-id={bookId}>
      {JSON.stringify(reviews)}
      <button onClick={onReviewChanged}>投稿完了を通知</button>
    </div>
  ),
}));

vi.mock("../utils/logger", () => ({
  logger: { error: vi.fn() },
}));

vi.mock("../api/apiClient", () => ({
  apiClient: {
    getBookById: vi.fn(),
    getReviews: vi.fn(),
    deleteBook: vi.fn(),
  },
}));

const book = {
  id: 1,
  title: "Title",
  author: "Author",
  publicationYear: 2020,
  ISBN: "ABC",
  summary: "Summary",
  createdAt: "",
  updatedAt: "",
};

const reviews = [
  {
    id: 1,
    bookId: 1,
    userId: 1,
    rating: 5,
    content: "great",
    createdAt: "",
  },
];

describe("BookDetailPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseParams.mockReturnValue({ bookId: "1" });
    asUser(null);
    (apiClient.deleteBook as unknown as ReturnType<typeof vi.fn>).mockReset();
    (apiClient.getBookById as unknown as ReturnType<typeof vi.fn>).mockReset();
    (apiClient.getReviews as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("書籍とレビューを読み込み内容をレンダリングする", async () => {
    (
      apiClient.getBookById as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: book });
    (
      apiClient.getReviews as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: { reviews } });

    render(<BookDetailPage />);

    expect(screen.getByText(/書籍一覧に戻る/)).toBeInTheDocument();
    expect(screen.getByText(/レビューを読み込み中/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("book-info-detail")).toBeInTheDocument();
      expect(screen.getByTestId("review-section-detail")).toBeInTheDocument();
      expect(
        screen.queryByText(/レビューを読み込み中/),
      ).not.toBeInTheDocument();
    });

    // back button action
    fireEvent.click(screen.getByText(/書籍一覧に戻る/));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("詳細取得に失敗したときエラーテキストを表示する", async () => {
    (
      apiClient.getBookById as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("fail book"));
    (
      apiClient.getReviews as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: { reviews } });

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/書籍情報の取得に失敗しました。/),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/レビューを読み込み中/),
      ).not.toBeInTheDocument();
    });
  });

  it("レビュー取得に失敗したときエラーを表示する", async () => {
    (
      apiClient.getBookById as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: book });
    (
      apiClient.getReviews as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("fail reviews"));

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/レビューの取得に失敗しました。/),
      ).toBeInTheDocument();
    });
  });

  it("レビュー投稿の通知を受けると、書籍とレビューを再取得して表示を更新する", async () => {
    const getBook = apiClient.getBookById as unknown as ReturnType<
      typeof vi.fn
    >;
    const getReviews = apiClient.getReviews as unknown as ReturnType<
      typeof vi.fn
    >;
    getBook.mockResolvedValue({ data: book });
    getReviews.mockResolvedValue({ data: { reviews } });
    render(<BookDetailPage />);
    await screen.findByTestId("review-section-detail");
    // 書籍 ID がレビューセクションに渡る
    expect(screen.getByTestId("review-section-detail")).toHaveAttribute(
      "data-book-id",
      "1",
    );

    // 投稿後は、平均評価・件数が変わった書籍と、増えたレビューが返ってくる
    const newBook = { ...book, reviewCount: 2 };
    const newReviews = [...reviews, { ...reviews[0], id: 2, content: "new" }];
    getBook.mockResolvedValue({ data: newBook });
    getReviews.mockResolvedValue({ data: { reviews: newReviews } });
    fireEvent.click(screen.getByText("投稿完了を通知"));

    await waitFor(() => {
      expect(screen.getByTestId("book-info-detail")).toHaveTextContent(
        '"reviewCount":2',
      );
      expect(screen.getByTestId("review-section-detail")).toHaveTextContent(
        "new",
      );
    });
    // 再取得中に画面全体を「読み込み中」に戻さない（フォームの状態を保つため）
    expect(screen.queryByText(/レビューを読み込み中/)).not.toBeInTheDocument();
  });

  it("投稿後の再取得に失敗しても、今の表示を残す", async () => {
    const getBook = apiClient.getBookById as unknown as ReturnType<
      typeof vi.fn
    >;
    const getReviews = apiClient.getReviews as unknown as ReturnType<
      typeof vi.fn
    >;
    getBook.mockResolvedValue({ data: book });
    getReviews.mockResolvedValue({ data: { reviews } });
    render(<BookDetailPage />);
    await screen.findByTestId("review-section-detail");

    getReviews.mockRejectedValue(new Error("fail reload"));
    fireEvent.click(screen.getByText("投稿完了を通知"));

    await waitFor(() => expect(getReviews).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("review-section-detail")).toHaveTextContent(
      "great",
    );
    expect(screen.queryByText(/取得に失敗しました/)).not.toBeInTheDocument();
  });

  it("bookId がないとき API を呼ばない", async () => {
    mockUseParams.mockReturnValue({ bookId: undefined });
    render(<BookDetailPage />);

    await waitFor(() => {
      expect(apiClient.getBookById).not.toHaveBeenCalled();
      expect(apiClient.getReviews).not.toHaveBeenCalled();
      expect(screen.getByText(/レビューを読み込み中/)).toBeInTheDocument();
    });
  });

  describe("書籍の削除（管理者のみ）", () => {
    const mockLoaded = () => {
      (
        apiClient.getBookById as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ data: book });
      (
        apiClient.getReviews as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ data: { reviews } });
    };
    const deleteBook = () =>
      apiClient.deleteBook as unknown as ReturnType<typeof vi.fn>;

    it.each([
      ["未ログイン", null],
      ["一般ユーザー", "user"],
    ] as const)("%s には「削除」を表示しない", async (_label, role) => {
      asUser(role);
      mockLoaded();
      render(<BookDetailPage />);
      await screen.findByTestId("review-section-detail");

      expect(
        screen.queryByRole("button", { name: /削除/ }),
      ).not.toBeInTheDocument();
    });

    it("管理者が確認して削除すると、ダッシュボードへ戻る", async () => {
      asUser("admin");
      mockLoaded();
      deleteBook().mockResolvedValue(undefined);
      render(<BookDetailPage />);
      await screen.findByTestId("review-section-detail");

      fireEvent.click(screen.getByRole("button", { name: /削除/ }));
      // 確認を挟むので、この時点ではまだ削除しない
      expect(deleteBook()).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard"),
      );
      expect(deleteBook()).toHaveBeenCalledWith(1);
    });

    it("キャンセルすると削除せず、画面に留まる", async () => {
      asUser("admin");
      mockLoaded();
      render(<BookDetailPage />);
      await screen.findByTestId("review-section-detail");

      fireEvent.click(screen.getByRole("button", { name: /削除/ }));
      fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(deleteBook()).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /削除/ })).toBeInTheDocument();
    });

    it.each([
      [409, "関連データがあるため、この書籍は削除できません"],
      [403, "書籍を削除する権限がありません"],
      [404, "書籍が見つかりません"],
    ])("%i のときはエラーを表示し、遷移しない", async (status, message) => {
      asUser("admin");
      mockLoaded();
      deleteBook().mockRejectedValue(new ApiHttpError(status, "err"));
      render(<BookDetailPage />);
      await screen.findByTestId("review-section-detail");

      fireEvent.click(screen.getByRole("button", { name: /削除/ }));
      fireEvent.click(screen.getByRole("button", { name: "削除する" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
