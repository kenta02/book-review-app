import { createContext } from "react";
import type { AuthUser, LoginRequest, RegisterRequest } from "../types";

/**
 * 認証の状態。
 * - loading: 保存済みトークンの検証中（リロード直後。画面のちらつき防止に使う）
 * - authenticated: ログイン済み
 * - unauthenticated: 未ログイン
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/** useAuth() が返す値の型 */
export interface AuthContextValue {
  /** ログイン中のユーザー。未ログイン・検証中は null */
  user: AuthUser | null;
  /** 認証の状態 */
  status: AuthStatus;
  /** ログインする。失敗時は AppError を投げる */
  login: (body: LoginRequest) => Promise<void>;
  /** 新規登録してそのままログインする。失敗時は AppError を投げる */
  register: (body: RegisterRequest) => Promise<void>;
  /** ログアウトする（トークンを破棄） */
  logout: () => void;
}

/** 認証状態を共有する Context。直接使わず、useAuth() 経由で読むこと */
export const AuthContext = createContext<AuthContextValue | null>(null);
