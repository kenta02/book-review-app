import type {
  ApiResponse,
  CreateReviewRequest,
  Pagination,
  Review,
  UpdateReviewRequest,
} from "../types";

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
   * @returns { reviews: Review[], pagination?: Pagination } レビューの配列とページネーション情報
   */
  async getReviews(bookId?: number): Promise<
    ApiResponse<{
      reviews: Review[];
      pagination?: Pagination;
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

  /**
   * レビューの作成
   * @param body  - レビュー作成リクエストの内容
   * bookId: 書籍ID
   * userId: ユーザーID（nullも許容）
   * rating: 評価（例: 1-5）
   * content: レビュー本文
   * @returns { data: Review } 作成されたレビュー情報
   */
  async createReview(body: CreateReviewRequest): Promise<ApiResponse<Review>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 遅延をシミュレート

    // 新しいレビューIDを生成（mockReviewsの最大ID + 1）
    const newId = Math.max(...Object.keys(mockReviews).map(Number)) + 1;

    const newReview: Review = {
      id: newId,
      bookId: body.bookId,
      userId: 1, // モックなので固定のユーザーIDを使用（例: 1）
      rating: body.rating,
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    // mockReviewsに新しいレビューを追加
    mockReviews[newId] = newReview;

    return {
      data: newReview,
    };
  },

  /**
   * レビューの更新
   * @param body - レビュー更新リクエストの内容
   * reviewId: 更新するレビューのID
   * rating: 更新後の評価（例: 1-5、オプション）
   * content: 更新後のレビュー本文（オプション）
   * @returns { data: Review } 更新されたレビュー情報
   */
  async updateReview(body: UpdateReviewRequest): Promise<ApiResponse<Review>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 遅延をシミュレート

    const review = mockReviews[body.reviewId];
    if (!review) {
      throw new Error(`レビュー${body.reviewId}が見つかりません`);
    }

    // 更新内容を反映
    if (body.rating !== undefined) {
      review.rating = body.rating;
    }
    if (body.content !== undefined) {
      review.content = body.content;
    }
    review.updatedAt = new Date().toISOString();

    return {
      data: review,
    };
  },

  /**
   * レビューの削除
   * @param reviewId - 削除するレビューのID
   * @returns { data: null } 削除成功のレスポンス
   */
  async deleteReview(reviewId: number): Promise<ApiResponse<null>> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 遅延をシミュレート

    const review = mockReviews[reviewId];
    if (!review) {
      throw new Error(`レビュー${reviewId}が見つかりません`);
    }

    // mockReviewsから該当レビューを削除
    delete mockReviews[reviewId];

    return {
      data: null,
    };
  },
};
