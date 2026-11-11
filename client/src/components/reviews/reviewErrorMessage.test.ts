import { describe, expect, it } from "vitest";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import {
  getReviewChangeErrorMessage,
  getReviewErrorMessage,
} from "./reviewErrorMessage";

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

describe("getReviewChangeErrorMessage", () => {
  it("404 は「書籍」ではなく「レビュー」が見つからない旨を返す", () => {
    const message = getReviewChangeErrorMessage(
      new AppError(ERROR_CODES.NOT_FOUND, "x", 404),
      "update",
    );
    expect(message).toContain("対象のレビューが見つかりません");
  });

  it("403 は権限がない旨を返す", () => {
    expect(
      getReviewChangeErrorMessage(
        new AppError(ERROR_CODES.FORBIDDEN, "x", 403),
        "delete",
      ),
    ).toContain("権限がありません");
  });

  it("削除時の 409 は、コメントが付いていて削除できない旨を返す", () => {
    // normalizeError は 409 を VALIDATION_ERROR にするが、statusCode は残る
    expect(
      getReviewChangeErrorMessage(
        new AppError(ERROR_CODES.VALIDATION_ERROR, "x", 409),
        "delete",
      ),
    ).toContain("コメントが付いているレビューは削除できません");
  });

  it("編集時の 409 は削除用の文言にせず、共通の文言にする", () => {
    expect(
      getReviewChangeErrorMessage(
        new AppError(ERROR_CODES.VALIDATION_ERROR, "x", 409),
        "update",
      ),
    ).toContain("入力内容に誤りがあります");
  });

  it("それ以外は投稿用と同じ文言にする", () => {
    expect(
      getReviewChangeErrorMessage(
        new AppError(ERROR_CODES.NETWORK_ERROR),
        "update",
      ),
    ).toContain("通信に失敗しました");
  });
});
