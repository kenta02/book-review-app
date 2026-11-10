import { describe, expect, it } from "vitest";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { getReviewErrorMessage } from "./reviewErrorMessage";

describe("getReviewErrorMessage", () => {
  it.each([
    [ERROR_CODES.UNAUTHORIZED, "ログインの有効期限が切れました"],
    [ERROR_CODES.VALIDATION_ERROR, "入力内容に誤りがあります"],
    [ERROR_CODES.NOT_FOUND, "対象の書籍が見つかりません"],
    [ERROR_CODES.NETWORK_ERROR, "通信に失敗しました"],
    [ERROR_CODES.SERVER_ERROR, "サーバーでエラーが発生しました"],
    [ERROR_CODES.UNKNOWN, "エラーが発生しました"],
  ])("%s のとき日本語メッセージを返す", (code, expected) => {
    expect(getReviewErrorMessage(new AppError(code))).toContain(expected);
  });

  it("サーバーのメッセージ（英語）は画面に出さない", () => {
    const message = getReviewErrorMessage(
      new AppError(ERROR_CODES.SERVER_ERROR, "SequelizeConnectionError"),
    );
    expect(message).not.toContain("Sequelize");
  });
});
