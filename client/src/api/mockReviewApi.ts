import type { ApiResponse, Review } from "../types";

// レビューのモックデータ
const mockReviews: Record<number, Review> = {
  1: {
    id: 1,
    bookId: 101,
    userId: 1,
    rating: 5,
    content: "この本は最高でした！",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  2: {
    id: 2,
    bookId: 102,
    userId: 2,
    rating: 4,
    content: "面白かったけど、少し長すぎました。",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  3: {
    id: 3,
    bookId: 101,
    userId: 2,
    rating: 3,
    content: "まあまあでした。",
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
   * バックエンド仕様に合わせて、{ reviews: [], pagination?: {...} } 形式でレスポンス
   * @param bookId - 書籍ID（オプション）
   * @returns { reviews: Review[], pagination?: { currentPage, totalPages, totalItems, itemsPerPage } }
   */
  async getReviews(
    bookId?: number,
  ): Promise<
    ApiResponse<{
      reviews: Review[];
      pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>
  > {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 遅延をシミュレート

    // 値だけ取り出して配列に変換する
    let reviews = Object.values(mockReviews);

    // bookIdが指定されている場合はフィルタリングする
    if (bookId !== undefined) {
      reviews = reviews.filter((r) => r.bookId === bookId);
    }

    // バックエンド仕様に合わせて、reviews と pagination を返す
    return {
      data: {
        reviews,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: reviews.length,
          itemsPerPage: 20,
        },
      },
    };
  },
};
