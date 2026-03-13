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
