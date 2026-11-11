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

/**
 * 既存レビューの編集・削除で起きたエラーを、利用者に見せる日本語メッセージに変換する。
 * 投稿用（getReviewErrorMessage）との違い: 404 は「書籍」ではなく「レビュー」が対象。
 * 403（他人のレビュー）と、削除時の 409（コメントが付いている）も専用の文言にする。
 * @param error - normalizeError 済みの AppError
 * @param action - 何をしようとしたか（"update": 編集 / "delete": 削除）
 * @returns 画面に表示するメッセージ
 * @example
 * getReviewChangeErrorMessage(new AppError(ERROR_CODES.VALIDATION_ERROR, "x", 409), "delete");
 * // => "コメントが付いているレビューは削除できません"
 */
export function getReviewChangeErrorMessage(
  error: AppError,
  action: "update" | "delete",
): string {
  if (error.errorCode === ERROR_CODES.NOT_FOUND) {
    return "対象のレビューが見つかりません。画面を更新して確認してください";
  }
  if (error.errorCode === ERROR_CODES.FORBIDDEN) {
    return "このレビューを操作する権限がありません";
  }
  // 409 は、サーバーが「関連データあり（コメント付き）」で削除を拒否したときに返す
  if (action === "delete" && error.statusCode === 409) {
    return "コメントが付いているレビューは削除できません";
  }
  return getReviewErrorMessage(error);
}
