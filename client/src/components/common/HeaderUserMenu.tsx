import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

/**
 * ヘッダー右側のユーザー表示。ログイン状態によって内容が変わる。
 * - 確認中（loading）: 何も出さない（ログイン／ログアウトの表示がちらつくのを防ぐ）
 * - ログイン済み: ユーザー名とログアウトボタン
 * - 未ログイン: ログイン・新規登録へのリンク
 * @example
 * <HeaderUserMenu />
 */
export function HeaderUserMenu() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated" && user) {
    /** ログアウトしてログイン画面へ戻る */
    const handleLogout = () => {
      logout();
      navigate("/login");
    };

    return (
      <div className="flex items-center gap-3">
        <span
          data-testid="header-username"
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {user.username}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        to="/login"
        className="text-gray-700 hover:text-purple-600 dark:text-gray-200"
      >
        ログイン
      </Link>
      <Link
        to="/register"
        className="rounded bg-purple-600 px-3 py-1 font-semibold text-white! transition hover:bg-purple-700 hover:text-white!"
      >
        新規登録
      </Link>
    </div>
  );
}
