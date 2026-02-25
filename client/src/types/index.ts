// ユーザープロフィール用に型を定義する
export interface User {
  id: number;
  username: string;
  email?: string;
  profileImageUrl?: string; // プロフィール画像のURL（オプション）
  bio?: string; // 自己紹介文（オプション）
  createdAt: string; // アカウント作成日時
  reviewCount?: number;
  favoriteCount?: number;
}

// APIレスポンスの型を定義する
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ページネーション情報の型を定義する
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// レビューの型を定義する
export interface Review {
  id: number;
  bookId: number;
  userId: number | null; // ユーザーが削除された場合は null
  rating: number; // 評価（例: 1-5）
  content: string; // レビュー本文（バックエンド仕様に合わせて comment から content に統一）
  createdAt: string; // レビュー作成日時
  updatedAt?: string; // レビュー更新日時
}

// レビュー作成リクエストの型
export interface CreateReviewRequest {
  bookId: number;
  rating: number;
  content: string;
}

// レビュー更新リクエストの型
export interface UpdateReviewRequest {
  reviewId: number;
  rating?: number;
  content?: string;
}

// レビュー削除リクエストの型
export interface DeleteReviewRequest {
  reviewId: number;
}
