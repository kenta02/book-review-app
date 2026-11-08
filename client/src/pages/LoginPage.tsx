import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthFormLayout } from "../components/auth/AuthFormLayout";
import { TextField } from "../components/auth/TextField";
import { getAuthErrorMessage } from "../auth/authErrorMessage";
import { useAuth } from "../auth/useAuth";
import { validateLoginForm, type FieldErrors } from "../auth/validateAuthForm";
import { normalizeError } from "../errors/normalizeError";
import type { LoginRequest } from "../types";

/**
 * ログイン画面（/login）。
 * - 送信前に入力を検証し、API のエラーは normalizeError → 日本語メッセージに変換して表示する
 * - ログイン済みになると、自動でダッシュボードへ移動する
 * @example
 * <Route path="/login" element={<LoginPage />} />
 */
export function LoginPage() {
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginRequest>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ログイン済み（ログイン成功直後を含む）はダッシュボードへ
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  /** 送信処理: 入力を検証し、通ればログイン API を呼ぶ */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const values: LoginRequest = { email: email.trim(), password };
    const errors = validateLoginForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await login(values);
    } catch (error) {
      setFormError(getAuthErrorMessage(normalizeError(error), "login"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      title="ログイン"
      footer={
        <>
          アカウントをお持ちでない方は{" "}
          <Link to="/register" className="text-purple-600 hover:underline">
            新規登録
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
          id="email"
          label="メールアドレス"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <TextField
          id="password"
          label="パスワード"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </AuthFormLayout>
  );
}
