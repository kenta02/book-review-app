import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./authContext";

/**
 * 認証状態（ユーザー・ログイン状態・login/register/logout）を取得するフック。
 * コンポーネントは Context を直接触らず、必ずこのフックを経由する。
 * （将来 Zustand などに差し替えても、このフックの中身だけを変えれば済む）
 * @throws AuthProvider の外で呼ぶとエラー
 * @example
 * const { user, status, logout } = useAuth();
 * if (status === "authenticated") console.log(user?.username);
 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth は AuthProvider の内側で使ってください");
  }
  return value;
}
