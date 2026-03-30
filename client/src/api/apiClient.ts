import type {
  ApiResponse,
  Book,
  BookListQuery,
  BookListResponse,
  CreateBookRequest,
  CreateReviewRequest,
  DeleteReviewRequest,
  Pagination,
  Review,
  UpdateReviewRequest,
  User,
} from "../types";
import { ApiHttpError } from "../errors/AppError";
import { mockBookApi } from "./mockBookApi";
import { mockReviewApi } from "./mockReviewApi";
import { mockUserApi } from "./mockUserApi";

// VITE_USE_MOCK=true でモック API、false で実 API を使用
const isMockMode = (): boolean => import.meta.env.VITE_USE_MOCK === "true";

/**
 * API レスポンスの `data` ラッパーを取り除き、内側の値を返す。
 * `{ data: T }` 形式の場合は `.data` を、そうでない場合はペイロードをそのまま返す。
 * @param payload - フェッチ後に JSON パースされた値
 */
function unwrapResponseData<T>(payload: unknown): T {
  if (payload !== null && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

/**
 * JSON レスポンスを返す API エンドポイントへリクエストを送り、パース済みの値を返す。
 * レスポンスが `ok` でない場合は {@link ApiHttpError} をスローする。
 * UI 層には直接渡さず、呼び出し元で normalizeError を通すこと。
 * @param input - フェッチ先の URL または RequestInfo
 * @param init - fetch オプション（メソッド・ヘッダー・ボディ等）
 * @returns パース・アンラップ済みのレスポンスデータ
 */
async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new ApiHttpError(response.status, response.statusText);
  }

  const rawText = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawText) as unknown;
  } catch {
    // API から JSON が返らない場合は、呼び出し元で扱いやすい HTTP エラーへ寄せる。
    throw new ApiHttpError(
      response.status,
      rawText
        ? `Invalid JSON response: ${rawText.slice(0, 200)}`
        : "Invalid JSON response",
    );
  }

  return unwrapResponseData<T>(payload);
}

/**
 * レスポンスボディを必要としない API エンドポイントへリクエストを送る（主に DELETE）。
 * レスポンスが `ok` でない場合は {@link ApiHttpError} をスローする。
 * UI 層には直接渡さず、呼び出し元で normalizeError を通すこと。
 * @param input - フェッチ先の URL または RequestInfo
 * @param init - fetch オプション（メソッド・ヘッダー・ボディ等）
 */
async function fetchVoid(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<void> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new ApiHttpError(response.status, response.statusText);
  }
}

export const apiClient = {
  /**
   * ユーザー情報を ID から取得
   * @param userId - ユーザー ID
   * @returns {data: User} ユーザー情報
   */
  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    if (isMockMode()) {
      return await mockUserApi.getUserById(userId);
    } else {
      const user = await fetchJson<User>(`/api/users/${userId}`);
      return { data: user };
    }
  },

  /**
   * レビュー情報を ID から取得
   * @param reviewId - レビュー ID
   * @returns {data: Review} レビュー情報
   *
   */
  getReviewById: async (reviewId: number): Promise<ApiResponse<Review>> => {
    if (isMockMode()) {
      return await mockReviewApi.getReviewById(reviewId);
    } else {
      const review = await fetchJson<Review>(`/api/reviews/${reviewId}`);
      return { data: review };
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
    if (isMockMode()) {
      // モック側に同じシグネチャがある
      return await mockReviewApi.getReviews(bookId);
    } else {
      // クエリパラメータで絞り込み
      const url =
        bookId == null ? `/api/reviews` : `/api/reviews?bookId=${bookId}`;
      const data = await fetchJson<{
        reviews: Review[];
        pagination?: Pagination;
      }>(url);
      return {
        data,
      };
    }
  },

  // レビューの作成
  createReview: async (
    body: CreateReviewRequest,
  ): Promise<ApiResponse<Review>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockReviewApi.createReview(body);
    } else {
      const review = await fetchJson<Review>(`/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return { data: review };
    }
  },

  // レビューの更新
  updateReview: async (
    body: UpdateReviewRequest,
  ): Promise<ApiResponse<Review>> => {
    if (isMockMode()) {
      return await mockReviewApi.updateReview(body);
    } else {
      const review = await fetchJson<Review>(`/api/reviews/${body.reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return { data: review };
    }
  },
  // レビューの削除
  deleteReview: async (body: DeleteReviewRequest): Promise<void> => {
    if (isMockMode()) {
      await mockReviewApi.deleteReview(body.reviewId);
    } else {
      await fetchVoid(`/api/reviews/${body.reviewId}`, {
        method: "DELETE",
      });
    }
  },

  /**
   * 全書籍一覧を取得する
   * @returns {Promise<ApiResponse<BookListResponse>>} 書籍の配列 + ページネーション
   */
  getAllBooks: async (): Promise<ApiResponse<BookListResponse>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.searchBooks();
    } else {
      // seachBooks と同じエンドポイントにクエリなしでリクエストを送る
      return await apiClient.searchBooks();
    }
  },

  // 書籍情報を取得する
  getBookById: async (bookId: number): Promise<ApiResponse<Book>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.getBookById(bookId);
    } else {
      const book = await fetchJson<Book>(`/api/books/${bookId}`);
      return { data: book };
    }
  },
  // 書籍情報を取得する（ID 以外のクエリで検索）
  searchBooks: async (
    query?: BookListQuery,
  ): Promise<ApiResponse<BookListResponse>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.searchBooks(query);
    } else {
      // URLSearchParams で クエリパラメータを組み立てる
      const params = new URLSearchParams();

      // query が undefined のときは、そのまま /api/books にリクエスト
      if (!query) {
        const data = await fetchJson<BookListResponse>(`/api/books`);
        return { data };
      }
      // query が指定されている場合、すべてのパラメータを "!= null" で判定
      if (query.page != null) {
        params.append("page", query.page.toString());
      }
      if (query.limit != null) {
        params.append("limit", query.limit.toString());
      }
      if (query.keyword != null) {
        params.append("keyword", query.keyword);
      }
      if (query.author != null) {
        params.append("author", query.author);
      }
      if (query.publicationYearFrom != null) {
        params.append(
          "publicationYearFrom",
          query.publicationYearFrom.toString(),
        );
      }
      if (query.publicationYearTo != null) {
        params.append("publicationYearTo", query.publicationYearTo.toString());
      }
      if (query.ratingMin != null) {
        params.append("ratingMin", query.ratingMin.toString());
      }
      if (query.sort != null) {
        params.append("sort", query.sort);
      }
      if (query.order != null) {
        params.append("order", query.order);
      }

      // クエリパラメータを付与した URL を構築
      const queryString = params.toString();
      const url = `/api/books${queryString ? `?${queryString}` : ""}`;

      // API を呼び出して結果を返す
      const data = await fetchJson<BookListResponse>(url);
      return { data };
    }
  },
  // 書籍を作成する
  createBook: async (
    bookData: CreateBookRequest,
  ): Promise<ApiResponse<Book>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.createBook(bookData);
    } else {
      const book = await fetchJson<Book>(`/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });
      return { data: book };
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
    if (isMockMode()) {
      return await mockBookApi.updateBook(bookId, updatedData);
    } else {
      const book = await fetchJson<Book>(`/api/books/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      return { data: book };
    }
  },

  /**
   * 書籍を削除する
   * @param bookId - 削除する書籍のID
   * @returns {Promise<void>} 削除成功のレスポンス
   */
  deleteBook: async (bookId: number): Promise<void> => {
    if (isMockMode()) {
      await mockBookApi.deleteBook(bookId);
    } else {
      await fetchVoid(`/api/books/${bookId}`, {
        method: "DELETE",
      });
    }
  },
};
