export type BookSortField = 'title' | 'author' | 'publicationYear' | 'rating' | 'createdAt';
export type BookSortOrder = 'asc' | 'desc';

/**
 * GET /api/books - リスト取得クエリパラメータ
 * - validator で正規化後の値を扱うため、常に number として保持する
 */
export type ListBooksQueryDto = {
  page: number;
  limit: number;
  keyword?: string;
  author?: string;
  publicationYearFrom?: number;
  publicationYearTo?: number;
  ratingMin?: number;
  sort?: BookSortField;
  order?: BookSortOrder;
};

/**
 * POST /api/books - 書籍作成リクエスト
 * - 必須項目は title / author
 * - それ以外は既存 API 仕様に合わせて任意
 */
export type CreateBookDto = {
  title: string;
  author: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};

/**
 * PUT /api/books/:id - 書籍更新リクエスト
 * - 部分更新 API のため全項目 optional
 */
export type UpdateBookDto = {
  title?: string;
  author?: string;
  publicationYear?: number;
  ISBN?: string;
  summary?: string;
};
