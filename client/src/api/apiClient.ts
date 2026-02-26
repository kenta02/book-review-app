import type {
  ApiResponse,
  Book,
  CreateBookRequest,
  CreateReviewRequest,
  DeleteReviewRequest,
  Pagination,
  Review,
  UpdateReviewRequest,
  User,
} from "../types";
import { mockBookApi } from "./mockBookApi";
import { mockReviewApi } from "./mockReviewApi";
import { mockUserApi } from "./mockUserApi";

// VITE_USE_MOCK=true でモック API、false で実 API を使用
const VITE_USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const apiClient = {
  /**
   * ユーザー情報を ID から取得
   * @param userId - ユーザー ID
   * @returns {data: User} ユーザー情報
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
   * @param reviewId - レビュー ID
   * @returns {data: Review} レビュー情報
   *
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
   * @returns {data: { reviews: Review[]; pagination?: Pagination }} レビューの配列
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

  // TODO: 以下のAPIも必要に応じて実装する
  // レビューの作成
  createReview: async (
    body: CreateReviewRequest,
  ): Promise<ApiResponse<Review>> => {
    if (VITE_USE_MOCK) {
      // モックのAPIを呼び出す
      return await mockReviewApi.createReview(body);
    } else {
      // 実APIを呼び出す
      const response = await fetch(`/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`レビューの作成に失敗しました。`);
      }
      const payload = await response.json();
      const review = payload?.data ?? payload;
      return { data: review as Review };
    }
  },

  // レビューの更新
  updateReview: async (
    body: UpdateReviewRequest,
  ): Promise<ApiResponse<Review>> => {
    if (VITE_USE_MOCK) {
      return await mockReviewApi.updateReview(body);
    } else {
      const response = await fetch(`/api/reviews/${body.reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`レビューの更新に失敗しました。`);
      }
      const payload = await response.json();
      const review = payload?.data ?? payload;
      return { data: review as Review };
    }
  },
  // レビューの削除
  deleteReview: async (body: DeleteReviewRequest): Promise<void> => {
    if (VITE_USE_MOCK) {
      await mockReviewApi.deleteReview(body.reviewId);
    } else {
      const response = await fetch(`/api/reviews/${body.reviewId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`レビューの削除に失敗しました。`);
      }
    }
  },

  /**
   * 全書籍一覧を取得する
   * @returns {Promise<ApiResponse<{ books: Book[] }>>} 書籍の配列
   */
  getAllBooks: async (): Promise<ApiResponse<{ books: Book[] }>> => {
    if (VITE_USE_MOCK) {
      // モックのAPIを呼び出す
      return await mockBookApi.getAllBooks();
    } else {
      // 実APIを呼び出す
      const response = await fetch(`/api/books`);
      if (!response.ok) {
        throw new Error(`書籍一覧の取得に失敗しました。`);
      }
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return { data: data as { books: Book[] } };
    }
  },

  // 書籍情報を取得する
  getBookById: async (bookId: number): Promise<ApiResponse<Book>> => {
    if (VITE_USE_MOCK) {
      // モックのAPIを呼び出す
      return await mockBookApi.getBookById(bookId);
    } else {
      // 実APIを呼び出す
      const response = await fetch(`/api/books/${bookId}`);
      if (!response.ok) {
        throw new Error(`書籍${bookId}の情報の取得に失敗しました。`);
      }
      const payload = await response.json();
      const book = payload?.data ?? payload;
      return { data: book as Book };
    }
  },
  // 書籍を作成する
  createBook: async (
    bookData: CreateBookRequest,
  ): Promise<ApiResponse<Book>> => {
    if (VITE_USE_MOCK) {
      // モックのAPIを呼び出す
      return await mockBookApi.createBook(bookData);
    } else {
      // 実APIを呼び出す
      const response = await fetch(`/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });
      if (!response.ok) {
        throw new Error(`書籍の作成に失敗しました。`);
      }
      const payload = await response.json();
      const book = payload?.data ?? payload;
      return { data: book as Book };
    }
  },
  /**
   *  書籍を更新する
   * @param bookId - 更新する書籍のID
   * @param updatedData - 更新する書籍のデータ（部分的な更新も可能）
   * @returns {Promise<ApiResponse<Book>>} 更新された書籍情報
   */
  updateBook: async (
    bookId: number,
    updatedData: Partial<Book>,
  ): Promise<ApiResponse<Book>> => {
    if (VITE_USE_MOCK) {
      return await mockBookApi.updateBook(bookId, updatedData);
    } else {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error(`書籍${bookId}の更新に失敗しました。`);
      }
      const payload = await response.json();
      const book = payload?.data ?? payload;
      return { data: book as Book };
    }
  },

  /**
   * 書籍を削除する
   * @param bookId - 削除する書籍のID
   * @returns {Promise<void>} 削除成功のレスポンス
   */
  deleteBook: async (bookId: number): Promise<void> => {
    if (VITE_USE_MOCK) {
      await mockBookApi.deleteBook(bookId);
    } else {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`書籍${bookId}の削除に失敗しました。`);
      }
    }
  },
};
