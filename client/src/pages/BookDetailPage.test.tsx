import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookDetailPage } from "./BookDetailPage";
import { apiClient } from "../api/apiClient";

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ bookId: "1" });

vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as any;
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
  ReviewSectionDetail: ({ reviews }: { reviews: unknown }) => (
    <div data-testid="review-section-detail">{JSON.stringify(reviews)}</div>
  ),
}));

vi.mock("../utils/logger", () => ({
  logger: { error: vi.fn() },
}));

vi.mock("../api/apiClient", () => ({
  apiClient: {
    getBookById: vi.fn(),
    getReviews: vi.fn(),
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
    (apiClient.getBookById as unknown as ReturnType<typeof vi.fn>).mockReset();
    (apiClient.getReviews as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it("loads book and reviews and renders contents", async () => {
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

  it("shows error text when detail fetch fails", async () => {
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

  it("shows error when review fetch fails", async () => {
    (
      apiClient.getBookById as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ data: book });
    (
      apiClient.getReviews as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("fail reviews"));

    render(<BookDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/レビューの取得に失敗しました。/)).toBeInTheDocument();
    });
  });

  it("does not call APIs when bookId is missing", async () => {
    mockUseParams.mockReturnValue({ bookId: undefined });
    render(<BookDetailPage />);

    await waitFor(() => {
      expect(apiClient.getBookById).not.toHaveBeenCalled();
      expect(apiClient.getReviews).not.toHaveBeenCalled();
      expect(screen.getByText(/レビューを読み込み中/)).toBeInTheDocument();
    });
  });
});
