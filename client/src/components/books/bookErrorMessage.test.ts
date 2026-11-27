import { describe, expect, it } from "vitest";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import { getBookDeleteErrorMessage } from "./bookErrorMessage";

describe("getBookDeleteErrorMessage", () => {
  it("409 は関連データがあるため削除できない理由を返す", () => {
    const error = new AppError(ERROR_CODES.VALIDATION_ERROR, "x", 409);
    expect(getBookDeleteErrorMessage(error)).toBe(
      "レビューなどの関連データがあるため、この書籍は削除できません",
    );
  });

  it("403 は権限がない旨を返す", () => {
    const error = new AppError(ERROR_CODES.FORBIDDEN, "x", 403);
    expect(getBookDeleteErrorMessage(error)).toBe(
      "書籍を削除する権限がありません",
    );
  });

  it("404 は書籍が見つからない旨を返す", () => {
    const error = new AppError(ERROR_CODES.NOT_FOUND, "x", 404);
    expect(getBookDeleteErrorMessage(error)).toContain("書籍が見つかりません");
  });

  it.each([
    [ERROR_CODES.UNAUTHORIZED, "ログインの有効期限"],
    [ERROR_CODES.NETWORK_ERROR, "通信に失敗"],
    [ERROR_CODES.SERVER_ERROR, "サーバーでエラー"],
    [ERROR_CODES.UNKNOWN, "書籍を削除できませんでした"],
  ])("%s は対応する日本語メッセージを返す", (code, expected) => {
    expect(getBookDeleteErrorMessage(new AppError(code))).toContain(expected);
  });

  it("サーバーの英語メッセージをそのまま表示しない", () => {
    const error = new AppError(ERROR_CODES.FORBIDDEN, "Admin only", 403);
    expect(getBookDeleteErrorMessage(error)).not.toContain("Admin only");
  });
});
