import type { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

/**
 * 書籍の削除で起きたエラーを、利用者に見せる日本語メッセージに変換する。
 * サーバーのメッセージ（英語）はそのまま出さず、エラーコード・ステータスから決める。
 * 409 はサーバーが「関連データあり（レビューなどが紐づいている）」で削除を拒否したときに返す。
 * @param error - normalizeError 済みの AppError
 * @returns 画面に表示するメッセージ
 * @example
 * getBookDeleteErrorMessage(new AppError(ERROR_CODES.VALIDATION_ERROR, "x", 409));
 * // => "レビューなどの関連データがあるため、この書籍は削除できません"
 */
export function getBookDeleteErrorMessage(error: AppError): string {
  // 409 は errorCode が VALIDATION_ERROR に正規化されるため、先にステータスで判定する
  if (error.statusCode === 409) {
    return "レビューなどの関連データがあるため、この書籍は削除できません";
  }

  switch (error.errorCode) {
    case ERROR_CODES.FORBIDDEN:
      return "書籍を削除する権限がありません";
    case ERROR_CODES.NOT_FOUND:
      return "対象の書籍が見つかりません。すでに削除されている可能性があります";
    case ERROR_CODES.UNAUTHORIZED:
      return "ログインの有効期限が切れました。もう一度ログインしてください";
    case ERROR_CODES.NETWORK_ERROR:
      return "通信に失敗しました。ネットワークを確認して、もう一度お試しください";
    case ERROR_CODES.SERVER_ERROR:
      return "サーバーでエラーが発生しました。しばらくしてからお試しください";
    default:
      return "書籍を削除できませんでした。もう一度お試しください";
  }
}
