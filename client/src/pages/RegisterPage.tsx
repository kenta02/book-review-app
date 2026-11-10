import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthFormLayout } from "../components/auth/AuthFormLayout";
import { TextField } from "../components/auth/TextField";
import { getAuthErrorMessage } from "../auth/authErrorMessage";
import { useAuth } from "../auth/useAuth";
import {
  validateRegisterForm,
  type FieldErrors,
} from "../auth/validateAuthForm";
import { normalizeError } from "../errors/normalizeError";
import type { RegisterRequest } from "../types";

/**
 * 新規登録画面（/register）。
 * 登録に成功するとそのままログイン状態になり、ダッシュボードへ移動する。
 * 既にログイン済みの場合も、履歴を置き換えてダッシュボードへ移動する。
 * @throws {Error} AuthProvider の外で描画した場合
 * @example
 * <Route path="/register" element={<RegisterPage />} />
 */
export function RegisterPage() {
  const { status, register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterRequest>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ログイン済み（登録成功直後を含む）はダッシュボードへ
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  /**
   * 入力値を更新し、編集した項目のエラーとフォーム全体のエラーを消す。
   * 修正後も古いエラーが次の送信まで残り続けるのを防ぐ。
   * @param field - 編集した項目
   * @param setValue - その項目の値を更新する関数
   * @returns TextField の onChange に渡す関数
   */
  const handleChange =
    (field: keyof RegisterRequest, setValue: (value: string) => void) =>
    (value: string) => {
      setValue(value);
      setFormError(null);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

  /**
   * フォームの既定の送信を止め、ユーザー名とメールアドレスの前後の空白を除いて検証・送信する。
   * パスワードは変更せず、入力エラーがあれば API を呼ばずに項目ごとのエラーを表示する。
   * 登録処理の例外は捕捉して日本語メッセージで表示し、処理中は送信ボタンを無効にする。
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const values: RegisterRequest = {
      username: username.trim(),
      email: email.trim(),
      password,
    };
    const errors = validateRegisterForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await register(values);
    } catch (error) {
      setFormError(getAuthErrorMessage(normalizeError(error), "register"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      title="新規登録"
      footer={
        <>
          すでにアカウントをお持ちの方は{" "}
          <Link to="/login" className="text-purple-600 hover:underline">
            ログイン
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
          >
            {formError}
          </p>
        )}
        <TextField
          id="username"
          label="ユーザー名"
          autoComplete="username"
          value={username}
          onChange={handleChange("username", setUsername)}
          error={fieldErrors.username}
        />
        <TextField
          id="email"
          label="メールアドレス"
          type="email"
          autoComplete="email"
          value={email}
          onChange={handleChange("email", setEmail)}
          error={fieldErrors.email}
        />
        <TextField
          id="password"
          label="パスワード（8文字以上）"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={handleChange("password", setPassword)}
          error={fieldErrors.password}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-purple-600! px-4 py-2 font-semibold text-white transition hover:bg-purple-700! disabled:opacity-60"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>
    </AuthFormLayout>
  );
}
