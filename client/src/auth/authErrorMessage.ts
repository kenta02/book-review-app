import { AppError } from "../errors/AppError";
import { ERROR_CODES } from "../errors/errorCodes";

/** 認証画面の種類。同じエラーコードでも、画面によって伝える内容が変わる */
export type AuthFormKind = "login" | "register";

/**
 * 認証 API のエラーを、利用者に見せる日本語メッセージに変換する。
 * サーバーのメッセージはそのまま出さず、エラーコードから決める（内部情報を見せないため）。
 * - ログインの 401 は「メールかパスワードのどちらが誤りか」を伝えない（推測を防ぐ）
 * - 登録の 409（重複）は normalizeError で VALIDATION_ERROR になるため、その旨を伝える
 * @param error - normalizeError 済みの AppError
 * @param kind - どの画面のエラーか
 * @returns 画面に表示するメッセージ
 * @example
 * getAuthErrorMessage(new AppError(ERROR_CODES.UNAUTHORIZED), "login");
 * // => "メールアドレスまたはパスワードが正しくありません"
 */
export function getAuthErrorMessage(
  error: AppError,
  kind: AuthFormKind,
): string {
  switch (error.errorCode) {
    case ERROR_CODES.UNAUTHORIZED:
      return "メールアドレスまたはパスワードが正しくありません";
    case ERROR_CODES.VALIDATION_ERROR:
      return kind === "register"
        ? "このメールアドレスは既に登録されているか、入力内容に誤りがあります"
        : "入力内容に誤りがあります。確認してください";
    case ERROR_CODES.NETWORK_ERROR:
      return "通信に失敗しました。ネットワークを確認して、もう一度お試しください";
    case ERROR_CODES.SERVER_ERROR:
      return "サーバーでエラーが発生しました。しばらくしてからお試しください";
    default:
      return "エラーが発生しました。もう一度お試しください";
  }
}
