import { ERROR_CODES, type ErrorCode } from "../errors/errorCodes";

const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.VALIDATION_ERROR]:
    "入力内容に誤りがあります。内容を確認して再度お試しください。",
  [ERROR_CODES.UNAUTHORIZED]:
    "ログインが必要です。認証情報を確認してください。",
  [ERROR_CODES.FORBIDDEN]:
    "この操作を実行する権限がありません。",
  [ERROR_CODES.NOT_FOUND]:
    "対象のデータが見つかりませんでした。",
  [ERROR_CODES.SERVER_ERROR]:
    "サーバーで問題が発生しました。時間をおいて再度お試しください。",
  [ERROR_CODES.NETWORK_ERROR]:
    "通信に失敗しました。ネットワーク接続を確認してください。",
  [ERROR_CODES.UNKNOWN]:
    "予期せぬエラーが発生しました。",
};

export const BOOK_LIST_ERROR_MESSAGES: Record<ErrorCode, string> = {
  ...DEFAULT_ERROR_MESSAGES,
  [ERROR_CODES.NOT_FOUND]: "表示できる書籍一覧が見つかりませんでした。",
  [ERROR_CODES.SERVER_ERROR]:
    "書籍一覧の取得中にサーバーエラーが発生しました。時間をおいて再度お試しください。",
  [ERROR_CODES.NETWORK_ERROR]:
    "書籍一覧の取得に失敗しました。ネットワーク接続を確認してください。",
  [ERROR_CODES.UNKNOWN]: "書籍一覧の取得中に予期せぬエラーが発生しました。",
};

export const PROFILE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  ...DEFAULT_ERROR_MESSAGES,
  [ERROR_CODES.NOT_FOUND]: "ユーザー情報が見つかりませんでした。",
  [ERROR_CODES.SERVER_ERROR]:
    "ユーザー情報の取得中にサーバーエラーが発生しました。時間をおいて再度お試しください。",
  [ERROR_CODES.NETWORK_ERROR]:
    "ユーザー情報の取得に失敗しました。ネットワーク接続を確認してください。",
  [ERROR_CODES.UNKNOWN]:
    "ユーザー情報の取得中に予期せぬエラーが発生しました。",
};

export const REVIEW_LIST_ERROR_MESSAGES: Record<ErrorCode, string> = {
  ...DEFAULT_ERROR_MESSAGES,
  [ERROR_CODES.NOT_FOUND]: "レビュー一覧が見つかりませんでした。",
  [ERROR_CODES.SERVER_ERROR]:
    "レビュー一覧の取得中にサーバーエラーが発生しました。時間をおいて再度お試しください。",
  [ERROR_CODES.NETWORK_ERROR]:
    "レビュー一覧の取得に失敗しました。ネットワーク接続を確認してください。",
  [ERROR_CODES.UNKNOWN]:
    "レビュー一覧の取得中に予期せぬエラーが発生しました。",
};
