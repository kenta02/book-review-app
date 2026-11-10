import type { LoginRequest, RegisterRequest } from "../types";

/** フォームの項目ごとのエラーメッセージ（エラーが無い項目はキー自体が無い） */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// サーバー（auth.validator.ts）と同じ制約。送信前に分かるエラーは画面側で先に伝える。
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 320;
const PASSWORD_MIN_LENGTH = 8;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 150;

/**
 * メールアドレスの入力チェック。
 * @param email - 入力されたメールアドレス
 * @returns エラーメッセージ。問題なければ undefined
 */
function validateEmail(email: string): string | undefined {
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return "メールアドレスの形式が正しくありません";
  }
  return undefined;
}

/**
 * パスワードの入力チェック。
 * @param password - 入力されたパスワード
 * @returns エラーメッセージ。問題なければ undefined
 */
function validatePassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`;
  }
  return undefined;
}

/**
 * ログインフォームの入力チェック。
 * @param values - 入力値
 * @returns 項目ごとのエラー。空オブジェクトなら入力は正しい
 * @example
 * validateLoginForm({ email: "a", password: "short" });
 * // => { email: "メールアドレスの形式が正しくありません", password: "パスワードは8文字以上で入力してください" }
 */
export function validateLoginForm(
  values: LoginRequest,
): FieldErrors<LoginRequest> {
  const errors: FieldErrors<LoginRequest> = {};
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

/**
 * 新規登録フォームの入力チェック。
 * 値の正規化（trim）は行わない。サーバーの検証と結果を揃えるため、送信する値をそのまま渡すこと。
 * @param values - 入力値（送信する値そのまま）
 * @returns 項目ごとのエラー。空オブジェクトなら入力は正しい
 * @example
 * validateRegisterForm({ username: "a", email: "a@example.com", password: "password123" });
 * // => { username: "ユーザー名は2〜150文字で入力してください" }
 */
export function validateRegisterForm(
  values: RegisterRequest,
): FieldErrors<RegisterRequest> {
  const errors: FieldErrors<RegisterRequest> = {};
  // trim はしない（サーバーと同じく渡された値をそのまま検証する）。空白の除去は呼び出し側で行う
  const { username } = values;
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    errors.username = `ユーザー名は${USERNAME_MIN_LENGTH}〜${USERNAME_MAX_LENGTH}文字で入力してください`;
  }
  const emailError = validateEmail(values.email);
  const passwordError = validatePassword(values.password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}
