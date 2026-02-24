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
