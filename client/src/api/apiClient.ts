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

// API クライアントの入口。モック環境と実環境を切り替えて疎結合に保つ。
// - VITE_USE_MOCK=true でモック API、false で実 API を使用
// - 各 API は AbortSignal を引き回し、キャンセル対応を提供する。
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
  init?: Omit<RequestInit, "signal"> & { signal?: AbortSignal },
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new ApiHttpError(response.status, response.statusText);
  }

  const rawText = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawText) as unknown;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw e;
    }

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
  init?: Omit<RequestInit, "signal"> & { signal?: AbortSignal },
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
  getUserById: async (
    userId: number,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<User>> => {
    if (isMockMode()) {
      return await mockUserApi.getUserById(userId, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      const user = await fetchJson<User>(`/api/users/${userId}`, options);
      return { data: user };
    }
  },

  /**
   * レビュー情報を ID から取得
   * @param reviewId - レビュー ID
   * @returns {data: Review} レビュー情報
   *
   */
  getReviewById: async (
    reviewId: number,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Review>> => {
    if (isMockMode()) {
      return await mockReviewApi.getReviewById(reviewId, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      const review = await fetchJson<Review>(
        `/api/reviews/${reviewId}`,
        options,
      );
      return { data: review };
    }
  },
  /**
   * レビュー一覧を取得
   * @param bookId - 書籍 ID（省略可。未指定の場合は全レビュー取得）
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<{ reviews: Review[]; pagination?: Pagination }>>} レビューの配列とページネーション
   */
  getReviews: async (
    bookId?: number,
    abortSignal?: AbortSignal,
  ): Promise<
    ApiResponse<{
      reviews: Review[];
      pagination?: Pagination;
    }>
  > => {
    if (isMockMode()) {
      // モック側に同じシグネチャがある
      return await mockReviewApi.getReviews(bookId, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      // クエリパラメータで絞り込み
      const url =
        bookId == null ? `/api/reviews` : `/api/reviews?bookId=${bookId}`;
      const data = await fetchJson<{
        reviews: Review[];
        pagination?: Pagination;
      }>(url, options);
      return {
        data,
      };
    }
  },

  /**
   * レビューを作成する
   * @param body - レビュー作成のリクエストボディ
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<Review>>} 作成されたレビュー情報
   */
  createReview: async (
    body: CreateReviewRequest,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Review>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockReviewApi.createReview(body, abortSignal);
    } else {
      const options = abortSignal ? { signal: abortSignal } : undefined;
      const review = await fetchJson<Review>(`/api/reviews`, {
        ...options,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return { data: review };
    }
  },

  /**
   * レビューを更新する
   * @param body - レビュー更新のリクエストボディ（reviewId を含む）
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<Review>>} 更新されたレビュー情報
   */
  updateReview: async (
    body: UpdateReviewRequest,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Review>> => {
    if (isMockMode()) {
      return await mockReviewApi.updateReview(body, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      const review = await fetchJson<Review>(`/api/reviews/${body.reviewId}`, {
        ...options,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return { data: review };
    }
  },
  /**
   * レビューを削除する
   * @param body - 削除対象のレビュー ID
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<void>} 削除完了
   */
  deleteReview: async (
    body: DeleteReviewRequest,
    abortSignal?: AbortSignal,
  ): Promise<void> => {
    if (isMockMode()) {
      await mockReviewApi.deleteReview(body.reviewId, abortSignal);
    } else {
      const options = abortSignal ? { signal: abortSignal } : undefined;
      await fetchVoid(`/api/reviews/${body.reviewId}`, {
        ...options,
        method: "DELETE",
      });
    }
  },

  /**
   * 全書籍一覧を取得する（クエリなし）
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<BookListResponse>>} 書籍一覧とページネーション
   */
  getAllBooks: async (
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<BookListResponse>> => {
    // モックまたは実 API の切り替えを行う
    if (isMockMode()) {
      return await mockBookApi.searchBooks(undefined, abortSignal);
    } else {
      return await apiClient.searchBooks(undefined, abortSignal);
    }
  },

  /**
   * 書籍を ID から取得する
   * @param bookId - 書籍 ID
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<Book>>} 書籍情報
   */
  getBookById: async (
    bookId: number,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Book>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.getBookById(bookId, abortSignal);
    } else {
      const options = abortSignal ? { signal: abortSignal } : undefined;
      const book = await fetchJson<Book>(`/api/books/${bookId}`, options);
      return { data: book };
    }
  },
  /**
   * 検索・フィルタ・ソート条件付きで書籍一覧を取得
   * @param query - 検索・フィルタ・ソート条件（未指定時は全書籍一覧）
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<BookListResponse>>} 書籍一覧とページネーション
   */
  searchBooks: async (
    query?: BookListQuery,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<BookListResponse>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.searchBooks(query, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      // URLSearchParams で クエリパラメータを組み立てる
      const params = new URLSearchParams();

      // query が undefined のときは、そのまま /api/books にリクエスト
      if (!query) {
        const data = await fetchJson<BookListResponse>(`/api/books`, options);
        return { data };
      }

      // query が指定されている場合、各フィルタを条件付きで追加（null/undefined は除外）
      // これにより、未指定パラメータは URL に不要に含めない。
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

      // クエリ文字列を組み立てて URL に追加（空クエリは付与しない）
      const queryString = params.toString();
      const url = `/api/books${queryString ? `?${queryString}` : ""}`;

      // API を呼び出して結果を返す
      const data = await fetchJson<BookListResponse>(url, options);
      return { data };
    }
  },
  /**
   * 書籍を作成する
   * @param bookData - 書籍作成のリクエストボディ
   * @param abortSignal - リクエストキャンセル用の AbortSignal
   * @returns {Promise<ApiResponse<Book>>} 作成された書籍情報
   */
  createBook: async (
    bookData: CreateBookRequest,
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Book>> => {
    if (isMockMode()) {
      // モックのAPIを呼び出す
      return await mockBookApi.createBook(bookData, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      const book = await fetchJson<Book>(`/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
        ...options,
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
    abortSignal?: AbortSignal,
  ): Promise<ApiResponse<Book>> => {
    if (isMockMode()) {
      return await mockBookApi.updateBook(bookId, updatedData, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      const book = await fetchJson<Book>(`/api/books/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
        ...options,
      });
      return { data: book };
    }
  },

  /**
   * 書籍を削除する
   * @param bookId - 削除する書籍のID
   * @returns {Promise<void>} 削除成功のレスポンス
   */
  deleteBook: async (
    bookId: number,
    abortSignal?: AbortSignal,
  ): Promise<void> => {
    if (isMockMode()) {
      await mockBookApi.deleteBook(bookId, abortSignal);
    } else {
      // 実APIではconst optionとする
      const options = abortSignal ? { signal: abortSignal } : undefined;

      await fetchVoid(`/api/books/${bookId}`, {
        method: "DELETE",
        ...options,
      });
    }
  },
};
