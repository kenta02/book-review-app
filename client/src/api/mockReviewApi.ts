import type { ApiResponse, Review } from "../types";

// レビューのモックデータ
const mockReviews: Record<number, Review> = {
  1: {
    id: 1,
    bookId: 101,
    userId: 1,
    rating: 5,
    comment: "この本は最高でした！",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  2: {
    id: 2,
    bookId: 102,
    userId: 2,
    rating: 4,
    comment: "面白かったけど、少し長すぎました。",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  3: {
    id: 3,
    bookId: 101,
    userId: 2,
    rating: 3,
    comment: "まあまあでした。",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
};

// レビューのAPIのモック
export const mockReviewApi = {
  /**
   * レビュー情報を ID から取得
   * @param reviewId - レビュー ID
   * @returns レビュー情報
   */
  async getReviewById(reviewId: number): Promise<ApiResponse<Review>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500msの遅延をシミュレート

    // mockReviewsのidをキーに該当レビューを取得
    const review = mockReviews[reviewId];

    if (!review) {
      throw new Error(`レビュー${reviewId}が見つかりません`);
    }

    return {
      data: review,
    };
  },

  /**
   * 全レビュー一覧を取得（bookIdで絞り込み可能）
   * @param bookId - 書籍ID（オプション）
   * @returns レビューの配列
   */
  async getReviews(bookId?: number): Promise<ApiResponse<Review[]>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 遅延をシミュレート

    // 値だけ取り出して配列に変換する
    let reviews = Object.values(mockReviews);

    // bookIdが指定されている場合はフィルタリングする
    if (bookId !== undefined) {
      reviews = reviews.filter((r) => r.bookId === bookId);
    }

    return {
      data: reviews,
    };
  },
};
