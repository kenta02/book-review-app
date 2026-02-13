// DTO（最小導入）
// - DB の内部表現と API の入出力を分けるための最小限の型定義です。
// - routes 側で Model を DTO に変換して返します。
// - 将来的に OpenAPI やテストの基準として使えます。

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
