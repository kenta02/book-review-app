import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

/**
 * レビュー API のエラーを、利用者に見せる日本語メッセージに変換する。
 * サーバーのメッセージはそのまま出さず、エラーコードから決める（内部情報を見せないため）。
 * @param error - normalizeError 済みの AppError
 * @returns 画面に表示するメッセージ
 * @example
 * getReviewErrorMessage(new AppError(ERROR_CODES.UNAUTHORIZED));
 * // => "ログインの有効期限が切れました。もう一度ログインしてください"
 */
export function getReviewErrorMessage(error: AppError): string {
  switch (error.errorCode) {
    case ERROR_CODES.UNAUTHORIZED:
      return "ログインの有効期限が切れました。もう一度ログインしてください";
    case ERROR_CODES.VALIDATION_ERROR:
      return "入力内容に誤りがあります。確認してください";
    case ERROR_CODES.NOT_FOUND:
      return "対象の書籍が見つかりません";
    case ERROR_CODES.NETWORK_ERROR:
      return "通信に失敗しました。ネットワークを確認して、もう一度お試しください";
    case ERROR_CODES.SERVER_ERROR:
      return "サーバーでエラーが発生しました。しばらくしてからお試しください";
    default:
      return "エラーが発生しました。もう一度お試しください";
  }
}
