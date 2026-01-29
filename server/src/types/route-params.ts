/**
 * ルートパラメータの型定義
 * 各エンドポイントのパラメータ型をまとめて管理
 */

export interface BookParams {
  id: string;
}

export interface AuthParams {
  token?: string;
}

export interface CommentParams {
  reviewId: string;
  commentId: string;
}

export interface ReviewParams {
  reviewId: string;
}
