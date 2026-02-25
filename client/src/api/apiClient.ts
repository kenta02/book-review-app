import type { ApiResponse, Pagination, Review, User } from "../types";
import { mockReviewApi } from "./mockReviewApi";
import { mockUserApi } from "./mockUserApi";

// VITE_USE_MOCK=true でモック API、false で実 API を使用
const VITE_USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const apiClient = {
  /**
   * ユーザー情報を ID から取得
   * @param userId - ユーザー ID
   * @returns ユーザー情報
   */
  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    if (VITE_USE_MOCK) {
      return await mockUserApi.getUserById(userId);
    } else {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`ユーザー${userId}の情報の取得に失敗しました。`);
      }

      // レスポンス形式が { data: User } または User の両パターンに対応
      const payload = await response.json();
      const user = payload?.data ?? payload;

      return { data: user as User };
    }
  },

  /**
   * レビュー情報を ID から取得
   */
  getReviewById: async (reviewId: number): Promise<ApiResponse<Review>> => {
    if (VITE_USE_MOCK) {
      return await mockReviewApi.getReviewById(reviewId);
    } else {
      const response = await fetch(`/api/reviews/${reviewId}`);
      if (!response.ok) {
        throw new Error(`レビュー${reviewId}の情報の取得に失敗しました。`);
      }

      const payload = await response.json();
      const review = payload?.data ?? payload;

      return { data: review as Review };
    }
  },
  /**
   * レビュー一覧を取得
   * @param bookId - 書籍 ID
   * @returns レビューの配列
   */
  /**
   * レビュー一覧を取得
   * @param bookId - 書籍 ID (省略可)
   */
  getReviews: async (
    bookId?: number,
  ): Promise<
    ApiResponse<{
      reviews: Review[];
      pagination?: Pagination;
    }>
  > => {
    if (VITE_USE_MOCK) {
      // モック側に同じシグネチャがある
      return await mockReviewApi.getReviews(bookId);
    } else {
      // クエリパラメータで絞り込み
      const url =
        bookId != null ? `/api/reviews?bookId=${bookId}` : `/api/reviews`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`レビュー一覧の取得に失敗しました。`);
      }

      const payload = await response.json();
      // バックエンドレスポンス：{ success: true, data: { reviews: [...], pagination: {...} } }
      const data = payload?.data ?? payload;
      return {
        data: data as {
          reviews: Review[];
          pagination?: Pagination;
        },
      };
    }
  },
};
