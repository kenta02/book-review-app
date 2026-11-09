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

  /** 送信処理: 入力を検証し、通れば登録 API を呼ぶ */
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
          onChange={setUsername}
          error={fieldErrors.username}
        />
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
          label="パスワード（8文字以上）"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
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
