/**
 * POST /reviews/:reviewId/comments の期待入力（body）
 * - content: コメント本文
 * - parentId: 返信先コメントID（省略または null はトップレベル）
 */
export type CreateCommentDto = {
  content?: string;
  parentId?: number | null;
};

/**
 * Service層に渡す DTO - コメント作成
 */
export type CreateCommentServiceDto = {
  reviewId: number;
  content: string;
  parentId?: number | null;
  userId: number;
};

/**
 * API レスポンスに使うコメント型
 * - 日時は ISO 文字列で返します。
 */
export type CommentDto = {
  id: number;
  content: string;
  parentId: number | null;
  reviewId: number;
  userId: number | null;
  createdAt: string; // ISO 形式
  updatedAt: string; // ISO 形式
  replies?: CommentDto[]; // 子コメント（あれば）
};

/**
 * POST /api/reviews - レビュー作成リクエスト
 */
export type CreateReviewDto = {
  bookId: number;
  content: string;
  rating?: number;
};

/**
 * PUT /api/reviews/:reviewId - レビュー更新リクエスト
 */
export type UpdateReviewDto = {
  content: string;
};

/**
 * GET /api/reviews - リスト取得クエリパラメータ
 */
export type ListReviewsQueryDto = {
  page: number;
  limit: number;
  bookId?: number;
  userId?: number;
};

/**
 * API レスポンス - レビュー
 */
export type ReviewDto = {
  id: number;
  bookId: number;
  userId: number | null;
  content: string;
  rating?: number;
  createdAt: string; // ISO 形式
  updatedAt: string; // ISO 形式
};

/**
 * API レスポンス - レビュー詳細（Book/User情報を含む）
 */
export type ReviewDetailDto = ReviewDto & {
  bookTitle?: string;
  username?: string;
};

/**
 * Service層に渡す DTO - 作成
 * - userId を含む（route で認証から追加される）
 */
export type CreateReviewServiceDto = CreateReviewDto & {
  userId: number;
};

/**
 * Service層に渡す DTO - 更新
 * - userId と reviewId（権限チェック用）
 */
export type UpdateReviewServiceDto = UpdateReviewDto & {
  userId: number;
  reviewId: number;
};

/**
 * Service層に渡す DTO - 削除
 */
export type DeleteReviewServiceDto = {
  reviewId: number;
  userId: number;
};
