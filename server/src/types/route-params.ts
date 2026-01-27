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

// 将来的に必要になったら追加
// export interface ReviewParams {
//   bookId: string;
//   reviewId: string;
// }
