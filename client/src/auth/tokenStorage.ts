// JWT を localStorage に保存・取得・削除するための関数群。
// - プライベートブラウズ等で localStorage が使えない環境でもアプリが落ちないよう、
//   すべて try/catch で包み、失敗時は「トークンなし」として扱う。
// - apiClient（API 層）と AuthProvider（UI 層）の両方から使うため、
//   React に依存しない純粋な関数として分離している。

/** localStorage のキー名 */
export const TOKEN_STORAGE_KEY = "auth_token";

/**
 * 保存済みのトークンを取得する。
 * @returns トークン文字列。未保存・取得失敗時は null
 * @example
 * const token = getToken(); // "eyJhbGciOi..." または null
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * トークンを保存する。保存に失敗しても例外は投げない。
 * @param token - 保存する JWT
 * @example
 * setToken("eyJhbGciOi...");
 */
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // 保存できなくても、そのセッション中はメモリ上のログイン状態で動作できる
  }
}

/**
 * 保存済みのトークンを削除する（ログアウト時などに使う）。
 * @example
 * clearToken();
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // 削除できない環境では何もしない
  }
}
