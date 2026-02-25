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
