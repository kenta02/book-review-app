import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "../api/apiClient";
import { ERROR_CODES } from "../errors/errorCodes";
import { normalizeError } from "../errors/normalizeError";
import type {
  AuthResult,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./authContext";
import { clearToken, getToken, setToken } from "./tokenStorage";

interface AuthProviderProps {
  readonly children: ReactNode;
}

/**
 * アプリ全体にログイン状態を提供する Provider。
 * - 起動時: 保存済みトークンがあれば GET /api/auth/me で検証してログイン状態を復元する
 * - login / register 成功時: トークンを保存し、ユーザーを状態に反映する
 * - logout: トークンを破棄して未ログインに戻す
 * @example
 * <AuthProvider><App /></AuthProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // トークンが無ければ検証不要なので、最初から unauthenticated にする
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? "loading" : "unauthenticated",
  );

  // 起動時に、保存済みトークンの有効性を確認してログイン状態を復元する
  useEffect(() => {
    if (!getToken()) {
      return;
    }

    const controller = new AbortController();
    apiClient
      .getMe(controller.signal)
      .then((res) => {
        setUser(res.data.user);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        // 期限切れ・不正トークン（401/403）のときだけ破棄する。
        // 通信エラーなどの一時的な失敗でログアウトさせないため。
        const code = normalizeError(error).errorCode;
        if (
          code === ERROR_CODES.UNAUTHORIZED ||
          code === ERROR_CODES.FORBIDDEN
        ) {
          clearToken();
        }
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => controller.abort();
  }, []);

  /** 認証成功時の共通処理: トークン保存とユーザー反映 */
  const applyAuthResult = useCallback((result: AuthResult) => {
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (body: LoginRequest) => {
      try {
        const res = await apiClient.login(body);
        applyAuthResult(res.data);
      } catch (error) {
        // UI 層には正規化したエラーだけを渡す
        throw normalizeError(error);
      }
    },
    [applyAuthResult],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      try {
        const res = await apiClient.register(body);
        applyAuthResult(res.data);
      } catch (error) {
        throw normalizeError(error);
      }
    },
    [applyAuthResult],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // 値を安定させ、不要な再レンダリングを防ぐ
  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
